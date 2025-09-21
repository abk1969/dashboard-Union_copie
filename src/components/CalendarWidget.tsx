import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';

interface CalendarWidgetProps {
  meetings: CalendarEvent[];
  isLoading?: boolean;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ meetings, isLoading = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formater l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Grouper les événements par jour
  const groupEventsByDay = (events: CalendarEvent[]) => {
    const grouped: Record<string, CalendarEvent[]> = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dayKey = eventDate.toDateString();
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(event);
    });

    // Trier les événements par heure dans chaque jour
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  };

  const groupedEvents = groupEventsByDay(meetings);
  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📅 Calendrier</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📅 Calendrier</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-gray-500">Aucun événement à venir</p>
          <p className="text-sm text-gray-400 mt-1">Votre agenda est libre !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">📅 Calendrier</h3>
        <span className="text-sm text-gray-500">{meetings.length} événement{meetings.length > 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedEvents).slice(0, 3).map(([dayKey, dayEvents]) => {
          const eventDate = new Date(dayKey);
          const isToday = dayKey === today;
          const isTomorrow = dayKey === tomorrow;
          
          let dayLabel = formatDate(eventDate);
          if (isToday) dayLabel = "Aujourd'hui";
          else if (isTomorrow) dayLabel = "Demain";

          return (
            <div key={dayKey} className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-2">
                {dayLabel}
              </h4>
              <div className="space-y-2">
                {dayEvents.map((event, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800 text-sm">
                          {event.title}
                        </h5>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatTime(event.startTime)}
                          {event.endTime && ` - ${formatTime(event.endTime)}`}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(groupedEvents).length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 text-sm hover:text-blue-800">
            Voir tous les événements ({Object.keys(groupedEvents).length - 3} jour{Object.keys(groupedEvents).length - 3 > 1 ? 's' : ''} supplémentaires)
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;
