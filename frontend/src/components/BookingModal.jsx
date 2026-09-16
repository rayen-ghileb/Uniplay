import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

// --- REACT BIG CALENDAR IMPORTS ---
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import fr from "date-fns/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup Calendar Localizer
const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Starts on Monday
  getDay,
  locales,
});

// --- HELPER COMPONENTS ---

const getNext7Days = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const offset = d.getTimezoneOffset() * 60000;
    dates.push(new Date(d.getTime() - offset).toISOString().split("T")[0]);
  }
  return dates;
};

// Custom Searchable Dropdown Field
function ParticipantSearchField({ selectedUsername, onChange, onRemove, users, showRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedUser = users.find((u) => u.username === selectedUsername);

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      u.first_name?.toLowerCase().includes(term) ||
      u.last_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="relative flex gap-2 w-full">
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Rechercher un étudiant (Nom ou Matricule)..."
          value={
            isOpen
              ? search
              : selectedUser
              ? `${selectedUser.first_name} ${selectedUser.last_name} (${selectedUser.username})`
              : ""
          }
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (selectedUsername) onChange("");
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-ink outline-none focus:border-crimson focus:ring-1 focus:ring-crimson bg-white"
        />
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <div
                  key={u.username}
                  onClick={() => {
                    onChange(u.username);
                    setSearch("");
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer text-ink border-b border-gray-50 last:border-0 transition-colors"
                >
                  <span className="font-bold">
                    {u.first_name} {u.last_name}
                  </span>
                  <span className="text-steel ml-1">({u.username})</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-steel text-center">
                Aucun étudiant trouvé.
              </div>
            )}
          </div>
        )}
      </div>
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 px-2 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// --- MAIN MODAL COMPONENT ---

export default function BookingModal({ terrain, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const days = getNext7Days();

  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [participantIds, setParticipantIds] = useState([""]);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Fetch available timeslots for a 7-day window to populate calendar
  const { data: timeslots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ["timeslots", terrain.id, selectedDate],
    queryFn: async () => {
      const res = await api.get(`/sports/terrains/${terrain.id}/timeslots/`, {
        params: { start_date: selectedDate, days: 7 },
      });
      return res.data;
    },
    enabled: !!terrain?.id,
  });

  // 2. Fetch all registered users for dropdown
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users/");
      return res.data;
    },
  });

  // Convert API timeslots to React Big Calendar events
  const calendarEvents = timeslots.map((slot) => {
    const slotDate = slot.date || selectedDate;
    const isSelected = selectedSlot?.id === slot.id;
    const isAvailable = slot.is_available !== false;

    return {
      id: slot.id,
      title: isSelected ? "Sélectionné" : isAvailable ? "Libre" : "Occupé",
      start: new Date(`${slotDate}T${slot.start_time}`),
      end: new Date(`${slotDate}T${slot.end_time}`),
      isAvailable,
      isSelected,
      resource: slot,
    };
  });

  // 3. Booking Mutation
  const bookMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/reservations/", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["reservations"]);
      queryClient.invalidateQueries(["timeslots"]);
      onClose();
      navigate("/reservations");
    },
    onError: (err) => {
      const errData = err.response?.data;
      if (typeof errData === "object") {
        const messages = Object.values(errData).flat().join(" ");
        setErrorMsg(messages || "Une erreur est survenue.");
      } else if (typeof errData === "string") {
        setErrorMsg(errData);
      } else {
        setErrorMsg("Erreur lors de la réservation.");
      }
    },
  });

  const handleParticipantChange = (index, value) => {
    const updated = [...participantIds];
    updated[index] = value;
    setParticipantIds(updated);
  };

  const addParticipantField = () => {
    if (participantIds.length < (terrain.capacity || 4) - 1) {
      setParticipantIds([...participantIds, ""]);
    }
  };

  const removeParticipantField = (index) => {
    const updated = [...participantIds];
    updated.splice(index, 1);
    setParticipantIds(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!selectedSlot) return;

    const cleanedIds = participantIds.filter((id) => id.trim() !== "");
    bookMutation.mutate({
      terrain: terrain.id,
      timeslot: selectedSlot.id,
      participant_ids: cleanedIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-3 backdrop-blur-md sm:p-6">
      <div className="booking-modal relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-4xl bg-white shadow-2xl">
        
        {/* Header */}
        <div className="relative flex-none overflow-hidden bg-ink px-6 py-6 text-white sm:px-8">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-24 border-crimson/30" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                <span className="h-2 w-2 rounded-full bg-crimson" />
                Nouvelle réservation
              </div>
              <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
                {terrain.name}
              </h2>
              <p className="mt-2 text-xs font-medium text-white/65">
                Choisissez un créneau et invitez vos coéquipiers.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/75 transition-colors hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-white/80">
            <span className="rounded-full bg-white/10 px-3 py-1.5">Capacité : {terrain.capacity} joueurs</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">7 jours disponibles</span>
          </div>
        </div>

        <div className="booking-modal-content min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-8">
          {errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
            ⚠️ {errorMsg}
          </div>
          )}

        {/* 1. Date Selector Quick-Bar */}
        <div className="rounded-2xl border border-gray-200 bg-fog/40 p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink">
                1. Sélectionner une date
              </label>
              <p className="mt-1 text-xs font-medium text-steel">Les créneaux sont affichés sur les 7 prochains jours.</p>
            </div>
            <span className="hidden rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-steel shadow-sm sm:block">
              Étape 1 / 3
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {days.map((dateStr) => {
              const dateObj = new Date(dateStr + "T00:00:00");
              const isSelected = selectedDate === dateStr;
              const dayName = dateObj.toLocaleDateString("fr-FR", { weekday: "short" });
              const dayNum = dateObj.getDate();

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setSelectedSlot(null);
                  }}
                  className={`group flex min-h-19 flex-col items-center justify-center rounded-xl border px-2 py-2 transition-all ${
                    isSelected
                      ? "border-crimson bg-crimson text-white shadow-lg shadow-crimson/20"
                      : "border-gray-200 bg-white text-steel hover:-translate-y-0.5 hover:border-crimson/50 hover:text-ink hover:shadow-md"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                    {dayName}
                  </span>
                  <span className="mt-1 text-2xl font-extrabold">{dayNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. React Big Calendar Display */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink">
                2. Choisissez un créneau
              </label>
              <p className="mt-1 text-xs font-medium text-steel">Les créneaux verts sont disponibles.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-steel">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Libre</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-400" />Occupé</span>
              {selectedSlot && <span className="rounded-full bg-crimson/10 px-2.5 py-1 text-crimson">{selectedSlot.start_time} - {selectedSlot.end_time}</span>}
            </div>
          </div>

          {loadingSlots ? (
            <div className="flex h-90 items-center justify-center rounded-xl bg-fog/50 text-xs font-semibold text-steel">
              Chargement des créneaux...
            </div>
          ) : (
            <div className="booking-calendar h-97.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                date={new Date(`${selectedDate}T00:00:00`)}
                onNavigate={(newDate) => {
                  const formatted = newDate.toISOString().split("T")[0];
                  setSelectedDate(formatted);
                }}
                defaultView="day"
                views={["day", "week"]}
                culture="fr"
                min={new Date(2026, 0, 1, 8, 0)}
                max={new Date(2026, 0, 1, 22, 0)}
                step={30}
                timeslots={2}
                eventPropGetter={(event) => {
                  let backgroundColor = "#10b981";
                  if (!event.isAvailable) backgroundColor = "#9ca3af";
                  if (event.isSelected) backgroundColor = "#d81e2c";

                  return {
                    style: {
                      backgroundColor,
                      color: "white",
                      borderRadius: "7px",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: event.isAvailable ? "pointer" : "not-allowed",
                    },
                  };
                }}
                onSelectEvent={(event) => {
                  if (event.isAvailable) {
                    setSelectedSlot(event.resource);
                    setErrorMsg("");
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* 3. Participants Dropdowns */}
        <div className="rounded-2xl border border-gray-200 bg-fog/40 p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink">
                3. Inviter des coéquipiers
              </label>
              <p className="mt-1 text-xs font-medium text-steel">Cette étape est optionnelle.</p>
            </div>
            <span className="hidden rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-steel shadow-sm sm:block">
              {participantIds.filter(Boolean).length} / {Math.max((terrain.capacity || 4) - 1, 1)} invités
            </span>
          </div>
          <div className="space-y-2">
            {participantIds.map((selectedUsername, idx) => (
              <ParticipantSearchField
                key={idx}
                users={allUsers}
                selectedUsername={selectedUsername}
                onChange={(newUsername) => handleParticipantChange(idx, newUsername)}
                onRemove={() => removeParticipantField(idx)}
                showRemove={participantIds.length > 1}
              />
            ))}
            {participantIds.length < (terrain.capacity || 4) - 1 && (
              <button
                type="button"
                onClick={addParticipantField}
                className="mt-2 inline-flex items-center rounded-lg px-1 text-xs font-bold text-crimson transition-colors hover:text-crimsonDark"
              >
                + Ajouter un joueur
              </button>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex flex-col gap-4 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Résumé</div>
            <div className="mt-1 text-sm font-bold text-ink">
              {selectedSlot ? `${selectedSlot.start_time} - ${selectedSlot.end_time}` : "Aucun créneau sélectionné"}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedSlot || bookMutation.isLoading}
            className={`w-full rounded-xl px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all sm:w-auto ${
              selectedSlot && !bookMutation.isLoading
                ? "bg-crimson shadow-lg shadow-crimson/20 hover:-translate-y-0.5 hover:bg-crimsonDark"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            {bookMutation.isLoading ? "Confirmation..." : "Valider la réservation"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}