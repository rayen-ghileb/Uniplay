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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6 scrollbar-hide">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="font-display text-2xl uppercase text-ink">
              Réserver {terrain.name}
            </h2>
            <p className="text-xs text-steel font-medium">
              Capacité maximale : {terrain.capacity} joueurs
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-steel hover:bg-gray-200 hover:text-ink transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 1. Date Selector Quick-Bar */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
            1. Sélectionner une date
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                  className={`flex min-w-[60px] flex-col items-center rounded-xl py-2 px-2 transition-all ${
                    isSelected
                      ? "bg-ink text-white shadow-md"
                      : "border border-gray-200 bg-gray-50 text-steel hover:border-ink"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">{dayName}</span>
                  <span className="text-base font-extrabold">{dayNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. React Big Calendar Display */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">
              2. Choisissez un créneau sur le calendrier
            </label>
            {selectedSlot && (
              <span className="text-xs font-bold text-crimson">
                Sélectionné: {selectedSlot.start_time} - {selectedSlot.end_time}
              </span>
            )}
          </div>

          {loadingSlots ? (
            <div className="py-12 text-center text-xs text-steel">
              Chargement des créneaux...
            </div>
          ) : (
            <div className="h-[360px] w-full rounded-2xl border border-gray-200 p-2 bg-white overflow-hidden">
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
                  let backgroundColor = "#10b981"; // Free slot (Emerald)
                  if (!event.isAvailable) backgroundColor = "#9ca3af"; // Occupied (Gray)
                  if (event.isSelected) backgroundColor = "#e11d48"; // Selected (Crimson)

                  return {
                    style: {
                      backgroundColor,
                      color: "white",
                      borderRadius: "8px",
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
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
            3. Inviter des coéquipiers (Optionnel)
          </label>
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
                className="text-xs font-bold text-crimson hover:underline pt-1"
              >
                + Ajouter un joueur
              </button>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedSlot || bookMutation.isLoading}
            className={`w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white transition-all ${
              selectedSlot && !bookMutation.isLoading
                ? "bg-crimson hover:bg-red-700 shadow-md"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {bookMutation.isLoading ? "Confirmation..." : "Valider la réservation"}
          </button>
        </div>

      </div>
    </div>
  );
}