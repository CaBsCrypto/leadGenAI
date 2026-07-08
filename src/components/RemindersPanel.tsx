import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Search, 
  Bell, 
  Trash2, 
  ExternalLink, 
  Briefcase, 
  Phone, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Edit2
} from 'lucide-react';
import { Lead } from '../types';

function safeParseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

interface RemindersPanelProps {
  savedLeads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
}

export function RemindersPanel({ savedLeads, onSelectLead, onUpdateLead }: RemindersPanelProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null); // YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [newReminderValue, setNewReminderValue] = useState('');

  // Extract all leads that actually have a reminder set
  const leadsWithReminders = useMemo(() => {
    return savedLeads.filter(l => typeof l.reminderAt === 'string' && l.reminderAt.trim() !== '');
  }, [savedLeads]);

  // General statistics
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let total = 0;
    let overdue = 0;
    let today = 0;
    let thisWeek = 0;

    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    leadsWithReminders.forEach(l => {
      const reminderValue = l.reminderAt;
      if (typeof reminderValue !== 'string') return;
      total++;
      const remDate = safeParseDate(reminderValue);
      if (!remDate) return;
      const remDateStr = reminderValue.split('T')[0];

      if (remDate.getTime() < now.getTime() && remDateStr !== todayStr) {
        overdue++;
      }
      if (remDateStr === todayStr) {
        today++;
      }
      if (remDate.getTime() >= now.getTime() && remDate.getTime() <= oneWeekLater.getTime()) {
        thisWeek++;
      }
    });

    return { total, overdue, today, thisWeek };
  }, [leadsWithReminders]);

  // Calendar generation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayIndex = useMemo(() => {
    const day = new Date(year, month, 1).getDay();
    // Adjust Sunday to be 6 if starting with Monday, or keep standard (0 = Sunday)
    // Let's use 0 = Sunday representation for standard calendar format, but adjust to:
    // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    return day;
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Convert a calendar day number to standard YYYY-MM-DD
  const formatDayString = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Get index list of leads that have reminders on a specific date string
  const getRemindersForDate = (dateStr: string) => {
    return leadsWithReminders.filter(l => {
      const reminderValue = l.reminderAt;
      if (typeof reminderValue !== 'string') return false;
      return reminderValue.startsWith(dateStr);
    });
  };

  // Filter reminders based on selected calendar day + search query
  const filteredRemindersList = useMemo(() => {
    let list = [...leadsWithReminders];

    // Filter by Selected Date
    if (selectedDayStr) {
      list = list.filter(l => {
        const reminderValue = l.reminderAt;
        return typeof reminderValue === 'string' && reminderValue.startsWith(selectedDayStr);
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) || 
        (l.industry && l.industry.toLowerCase().includes(q)) ||
        (l.location && l.location.toLowerCase().includes(q))
      );
    }

    // Sort chronologically: past (overdue) or nearest first
    return list.sort((a, b) => {
      const parsedA = a.reminderAt ? new Date(a.reminderAt).getTime() : 0;
      const parsedB = b.reminderAt ? new Date(b.reminderAt).getTime() : 0;
      const dateA = isNaN(parsedA) ? 0 : parsedA;
      const dateB = isNaN(parsedB) ? 0 : parsedB;
      return dateA - dateB;
    });
  }, [leadsWithReminders, selectedDayStr, searchQuery]);

  const handleClearReminder = async (leadId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este recordatorio?')) {
      await onUpdateLead(leadId, { reminderAt: '' });
      if (editingLeadId === leadId) {
        setEditingLeadId(null);
      }
    }
  };

  const handleSaveReschedule = async (leadId: string) => {
    if (!newReminderValue) return;
    await onUpdateLead(leadId, { reminderAt: newReminderValue });
    setEditingLeadId(null);
  };

  // Render Calendar Cells
  const calendarCells = useMemo(() => {
    const cells = [];
    const nowStr = new Date().toISOString().split('T')[0];

    // Padding cells for previous month spaces
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10 sm:h-14 bg-slate-50/40 rounded-xl" />);
    }

    // Active days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDayString(day);
      const remindersForDay = getRemindersForDate(dateStr);
      const isToday = dateStr === nowStr;
      const isSelected = dateStr === selectedDayStr;

      cells.push(
        <button
          key={`day-${day}`}
          onClick={() => {
            setSelectedDayStr(selectedDayStr === dateStr ? null : dateStr);
          }}
          className={`h-10 sm:h-14 relative rounded-2xl flex flex-col items-center justify-center font-bold text-xs sm:text-sm transition-all border-2 cursor-pointer ${
            isSelected 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
              : isToday
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <span>{day}</span>
          
          {/* Indicator Dot */}
          {remindersForDay.length > 0 && (
            <div className="absolute bottom-1 flex gap-0.5 justify-center">
              {remindersForDay.slice(0, 3).map((item, idx) => {
                const crmColors: Record<string, string> = {
                  new: 'bg-blue-400',
                  wait: 'bg-cyan-400',
                  contacted: 'bg-purple-400',
                  pitching: 'bg-amber-400',
                  closed: 'bg-emerald-400',
                  rejected: 'bg-rose-400',
                };
                const col = crmColors[item.crmStatus || 'new'] || 'bg-slate-400';
                return (
                  <span 
                    key={idx} 
                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isSelected ? 'bg-white' : col}`} 
                  />
                );
              })}
              {remindersForDay.length > 3 && (
                <span className={`text-[7px] leading-none ml-0.5 font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>+</span>
              )}
            </div>
          )}
        </button>
      );
    }

    return cells;
  }, [daysInMonth, firstDayIndex, selectedDayStr, leadsWithReminders, currentDate]);

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Juv', 'Vie', 'Sáb'];

  return (
    <div className="space-y-8 text-left">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">Agenda Inteligente CRM</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Recordatorios de <span className="text-indigo-600 italic">Seguimiento</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-bold">
            Monitorea reuniones, propuestas pendientes y llamadas agendadas con tus prospectos guardados.
          </p>
        </div>

        {/* Rapid search bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por lead o rubro..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-350 focus:ring-4 focus:ring-indigo-50 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold outline-none text-slate-700 placeholder-slate-400 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] block font-black uppercase text-slate-400 tracking-wider">Total Activos</span>
            <span className="text-xl font-black text-slate-800">{stats.total}</span>
          </div>
        </div>

        <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] block font-black uppercase text-rose-500 tracking-wider">Atrasados / Pendientes</span>
            <span className="text-xl font-black text-rose-700">{stats.overdue}</span>
          </div>
        </div>

        <div className="bg-cyan-50/30 border border-cyan-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] block font-black uppercase text-cyan-500 tracking-wider">Hoy</span>
            <span className="text-xl font-black text-cyan-700">{stats.today}</span>
          </div>
        </div>

        <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] block font-black uppercase text-emerald-500 tracking-wider">Próximos 7 días</span>
            <span className="text-xl font-black text-emerald-700">{stats.thisWeek}</span>
          </div>
        </div>
      </div>

      {/* Main interactive split block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Clean Custom Calendar Component */}
        <div className="lg:col-span-5 bg-white border border-slate-150 rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              {monthNames[month]} {year}
            </h3>
            <div className="flex gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-600 cursor-pointer transition-colors"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-600 cursor-pointer transition-colors"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days notation */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map((day, idx) => (
              <span key={idx} className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Grid Layout cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarCells}
          </div>

          {/* Calendar status legend details info */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block shrink-0" /> Nuevo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block shrink-0" /> Por Contactar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block shrink-0" /> Contactado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block shrink-0" /> Propuesta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block shrink-0" /> Cerrado
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Chronological reminders list */}
        <div className="lg:col-span-7 bg-white border border-slate-150 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                {selectedDayStr ? (() => {
                  const parsed = parseLocalDate(selectedDayStr);
                  return parsed ? `Recordatorios del ${parsed.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Seguimiento de Tareas';
                })() : 'Seguimiento de Tareas'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                {selectedDayStr ? 'Filtrado por fecha del calendario seleccionada' : 'Mostrando todos los recordatorios activos'}
              </p>
            </div>
            {selectedDayStr && (
              <button 
                onClick={() => setSelectedDayStr(null)}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs font-bold text-indigo-700 transition"
              >
                Ver todos
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {filteredRemindersList.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl"
                >
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-slate-700 font-bold text-sm">No se encontraron recordatorios</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto p-1 font-bold">
                    {selectedDayStr 
                      ? 'No hay reuniones u tareas asignadas para este día específico.' 
                      : 'Puedes añadir fechas de recordatorio en la columna de análisis de cada prospecto guardado.'}
                  </p>
                </motion.div>
              ) : (
                 filteredRemindersList.map((lead) => {
                   const reminderValue = lead.reminderAt;
                   const remainsDate = typeof reminderValue === 'string' ? safeParseDate(reminderValue) : null;
                   const isValidDate = !!remainsDate;
                   const now = new Date();
                   const isOverdue = isValidDate && remainsDate.getTime() < now.getTime() && 
                     (typeof reminderValue === 'string' ? reminderValue.split('T')[0] : '') !== now.toISOString().split('T')[0];
                   
                   const crmBadgeStyles: Record<string, string> = {
                     new: 'bg-blue-50 border-blue-150 text-blue-600',
                     wait: 'bg-cyan-50 border-cyan-150 text-cyan-600',
                     contacted: 'bg-purple-50 border-purple-150 text-purple-650',
                     pitching: 'bg-amber-50 border-amber-150 text-amber-700',
                     closed: 'bg-emerald-50 border-emerald-150 text-emerald-700',
                     rejected: 'bg-rose-50 border-rose-150 text-rose-600',
                   };
 
                   const crmLabels: Record<string, string> = {
                     new: 'Nuevo',
                     wait: 'Por Contactar',
                     contacted: 'Contactado',
                     pitching: 'Propuesta',
                     closed: 'Cierre Exitoso',
                     rejected: 'Perdido',
                   };
 
                   return (
                     <motion.div
                       layout
                       initial={{ opacity: 0, y: 15 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       key={lead.id}
                       className={`p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                         isOverdue 
                           ? 'border-rose-100 bg-rose-50/10 hover:border-rose-200' 
                           : 'border-slate-100 bg-white hover:border-indigo-100 '
                       }`}
                     >
                       <div className="space-y-2 flex-1 min-w-0">
                         {/* Title and Badge */}
                         <div className="flex flex-wrap items-center gap-2">
                           <h4 
                             onClick={() => onSelectLead(lead)}
                             className="font-black text-slate-800 hover:text-indigo-650 cursor-pointer truncate text-sm sm:text-base leading-tight" 
                             title="Haz clic para ver la ficha del cliente"
                           >
                             {lead.name}
                           </h4>
                           <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${crmBadgeStyles[lead.crmStatus || 'new'] || crmBadgeStyles.new}`}>
                             {crmLabels[lead.crmStatus || 'new'] || 'Nuevo'}
                           </span>
                         </div>
 
                         {/* Metadata details list */}
                         <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-450 text-[11px] font-bold">
                           {lead.industry && (
                             <span className="flex items-center gap-1.5 shrink-0">
                               <Briefcase className="w-3.5 h-3.5" />
                               {lead.industry}
                             </span>
                           )}
                           {lead.location && (
                             <span className="flex items-center gap-1.5 shrink-0 truncate max-w-[180px]">
                               <MapPin className="w-3.5 h-3.5 text-slate-400" />
                               {lead.location}
                             </span>
                           )}
                         </div>
 
                         {/* Reminder Badge */}
                         <div className={`mt-2 py-1.5 px-3 rounded-xl flex items-center gap-2 text-xs font-extrabold w-fit ${
                           isOverdue 
                             ? 'bg-rose-50 text-rose-700' 
                             : 'bg-indigo-50/50 text-indigo-700'
                         }`}>
                           <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'animate-pulse' : ''}`} />
                           <span>
                             {isOverdue ? 'Atrasado: ' : 'Programado: '}
                             {isValidDate ? remainsDate.toLocaleString('es-CL', { 
                               day: '2-digit', 
                               month: '2-digit', 
                               year: 'numeric',
                               hour: '2-digit', 
                               minute: '2-digit'
                             }) : 'Sin Fecha'}
                           </span>
                         </div>
                       </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 border-t border-slate-50 md:border-0 pt-3 md:pt-0">
                        {editingLeadId === lead.id ? (
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                            <input 
                              type="datetime-local" 
                              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none"
                              value={newReminderValue}
                              onChange={(e) => setNewReminderValue(e.target.value)}
                            />
                            <button
                              onClick={() => handleSaveReschedule(lead.id)}
                              className="p-1.5 bg-indigo-650 text-white rounded-lg hover:bg-indigo-700 text-[10px] font-bold"
                              title="Guardar cambio"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingLeadId(null)}
                              className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 font-bold text-[10px]"
                              title="Cancelar"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            {lead.phone && (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-xl"
                                title="Enviar WhatsApp o llamar por teléfono"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => onSelectLead(lead)}
                              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                              title="Ver detalles de lead en panel principal"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingLeadId(lead.id);
                                setNewReminderValue(lead.reminderAt || '');
                              }}
                              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                              title="Modificar fecha del recordatorio"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleClearReminder(lead.id)}
                              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                              title="Eliminar recordatorio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
