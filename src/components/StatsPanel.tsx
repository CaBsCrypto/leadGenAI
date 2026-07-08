import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart as RechartsPieChart, 
  Pie,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  PieChart as PieIcon, 
  BarChart2, 
  Calendar, 
  Activity, 
  Briefcase,
  Filter
} from 'lucide-react';
import { Lead } from '../types';

interface StatsPanelProps {
  savedLeads: Lead[];
}

export function StatsPanel({ savedLeads }: StatsPanelProps) {
  
  // Safe helper to extract date from any lead representation
  const getLeadDate = (lead: Lead): Date => {
    if (!lead.createdAt) {
      if (lead.lastFound) {
        const d = new Date(lead.lastFound);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    }
    if (typeof lead.createdAt.toDate === 'function') {
      return lead.createdAt.toDate();
    }
    if (typeof lead.createdAt.seconds === 'number') {
      return new Date(lead.createdAt.seconds * 1000);
    }
    const d = new Date(lead.createdAt);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  };

  // Define CRM status helpers
  const labelMap: Record<string, string> = {
    new: 'Nuevo',
    wait: 'Por Contactar',
    contacted: 'Contactado',
    pitching: 'Propuesta',
    closed: 'Cerrado',
    rejected: 'Perdido',
    modern: 'Muy Moderno',
  };

  const colorMap: Record<string, string> = {
    new: '#3b82f6',       // Blue
    wait: '#06b6d4',       // Cyan
    contacted: '#a855f7',  // Purple
    pitching: '#f59e0b',   // Amber
    closed: '#10b981',     // Emerald
    rejected: '#f43f5e',   // Rose
    modern: '#64748b',     // Slate
  };

  // 1. Core KPIs
  const kpis = useMemo(() => {
    const total = savedLeads.length;
    if (total === 0) return { total: 0, conversionRate: '0%', activePipeline: 0, avgScore: 0 };

    const closed = savedLeads.filter(l => l.crmStatus === 'closed').length;
    const conversionRate = `${Math.round((closed / total) * 100)}%`;
    const activePipeline = savedLeads.filter(l => 
      ['new', 'wait', 'contacted', 'pitching'].includes(l.crmStatus || 'new')
    ).length;

    // Calculate average optimization score
    // (A lead gains 20 pts per 'good' category and 10 pts per 'warning' category)
    const totalScore = savedLeads.reduce((acc, lead) => {
      let score = 50; // default base score
      if (lead.analysis) {
        // Evaluate based on typical status logic if analytical properties exist, otherwise standard random base
        score = 0;
        const seo = lead.status === 'optimized' ? 'good' : lead.status === 'old_tech' ? 'warning' : 'critic';
        score += seo === 'good' ? 20 : seo === 'warning' ? 10 : 0;
        score += 20; // fallback web metrics
        score += lead.website ? 20 : 0;
        score += lead.phone ? 20 : 0;
        score += lead.notesList && lead.notesList.length > 0 ? 20 : 10;
      } else {
        // Fallback calculation in case of simple leads
        const fieldsScore = (lead.website ? 25 : 0) + (lead.phone ? 25 : 0) + (lead.comuna ? 25 : 0) + (lead.industry ? 25 : 0);
        score = fieldsScore;
      }
      return acc + score;
    }, 0);
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

    return {
      total,
      conversionRate,
      activePipeline,
      avgScore
    };
  }, [savedLeads]);

  // 2. Growth Over Time Data (Cumulative Saved Leads)
  const growthData = useMemo(() => {
    if (savedLeads.length === 0) return [];

    const dateMap: { [key: string]: { dateStr: string; count: number; rawDate: Date } } = {};
    savedLeads.forEach(lead => {
      const d = getLeadDate(lead);
      const key = d.toISOString().split('T')[0]; // Year-Month-Day sorting key
      const dateStr = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
      if (!dateMap[key]) {
        dateMap[key] = { dateStr, count: 0, rawDate: d };
      }
      dateMap[key].count += 1;
    });

    const sortedDates = Object.entries(dateMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => ({
        key,
        dateStr: val.dateStr,
        count: val.count,
      }));

    let totalAccumulated = 0;
    return sortedDates.map(item => {
      totalAccumulated += item.count;
      return {
        fecha: item.dateStr,
        'Nuevos Leads': item.count,
        'Total Acumulado': totalAccumulated
      };
    });
  }, [savedLeads, getLeadDate]);

  // 3. Current Status Distribution Data
  const currentStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      new: 0,
      wait: 0,
      contacted: 0,
      pitching: 0,
      closed: 0,
      rejected: 0,
      modern: 0,
    };

    savedLeads.forEach(lead => {
      const status = lead.crmStatus || 'new';
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      } else {
        statusCounts.new += 1;
      }
    });

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        name: labelMap[status],
        value: count,
        color: colorMap[status],
      }))
      .filter(item => item.value > 0);
  }, [savedLeads]);

  // 5. CRM Funnel Conversion Data (Nuevo -> Cerrado)
  const funnelData = useMemo(() => {
    const totalLeads = savedLeads.length;
    if (totalLeads === 0) return [];

    const countWait = savedLeads.filter(l => l.crmStatus === 'wait').length;
    const countContacted = savedLeads.filter(l => l.crmStatus === 'contacted').length;
    const countPitching = savedLeads.filter(l => l.crmStatus === 'pitching').length;
    const countClosed = savedLeads.filter(l => l.crmStatus === 'closed').length;

    // Cumulative progression stages (standard funnel conversion)
    const stageClosed = countClosed;
    const stagePitching = countPitching + stageClosed;
    const stageContacted = countContacted + stagePitching;
    const stageWait = countWait + stageContacted;
    const stageNew = totalLeads;

    return [
      { value: stageNew, name: '1. Nuevo', fill: '#3b82f6', percent: 100 },
      { value: stageWait, name: '2. Por Contactar', fill: '#06b6d4', percent: stageNew > 0 ? Math.round((stageWait / stageNew) * 100) : 0 },
      { value: stageContacted, name: '3. Contactado', fill: '#a855f7', percent: stageNew > 0 ? Math.round((stageContacted / stageNew) * 105 / 1.05) : 0 }, // safe calculate percentage
      { value: stagePitching, name: '4. Propuesta', fill: '#f59e0b', percent: stageNew > 0 ? Math.round((stagePitching / stageNew) * 100) : 0 },
      { value: stageClosed, name: '5. Cerrado (Éxito)', fill: '#10b981', percent: stageNew > 0 ? Math.round((stageClosed / stageNew) * 100) : 0 },
    ].map(item => ({
      ...item,
      // Ensure percent calculation is precisely capped at 100 and non-negative
      percent: Math.min(Math.max(item.percent, 0), 100)
    }));
  }, [savedLeads]);

  // 4. CRM Status Distribution over Time (Chronological Status Progression Stacked Area Chart)
  const statusProgressionData = useMemo(() => {
    if (savedLeads.length === 0) return [];

    // Form timeline of events
    // Each event represents a state change for a specific lead on a particular day
    interface StateEvent {
      leadId: string;
      dateKey: string; // YYYY-MM-DD
      status: string;
    }

    const events: StateEvent[] = [];

    savedLeads.forEach(lead => {
      const creationDate = getLeadDate(lead);
      const creationKey = creationDate.toISOString().split('T')[0];
      
      // Determine initial status (default to 'new' or first historical log 'from')
      let initialStatus = 'new';
      if (lead.statusHistory && lead.statusHistory.length > 0) {
        initialStatus = lead.statusHistory[0].from || 'new';
      } else if (lead.crmStatus) {
        initialStatus = lead.crmStatus;
      }

      events.push({
        leadId: lead.id,
        dateKey: creationKey,
        status: initialStatus
      });

      // Follow up with historical changes if any
      if (lead.statusHistory) {
        lead.statusHistory.forEach(historyLog => {
          if (!historyLog.date) return;
          const logDate = new Date(historyLog.date);
          if (isNaN(logDate.getTime())) return;
          const logKey = logDate.toISOString().split('T')[0];
          events.push({
            leadId: lead.id,
            dateKey: logKey,
            status: historyLog.to
          });
        });
      }
    });

    // Extract all unique dates and sort them
    const uniqueDateKeys = Array.from(new Set(events.map(ev => ev.dateKey))).sort();

    // Map lead active statuses chronologically
    const activeLeadStates: Record<string, string> = {};

    return uniqueDateKeys.map(dateKey => {
      // Find all events on or before this date to build current state of active leads
      const eventsOnDate = events.filter(ev => ev.dateKey === dateKey);
      
      eventsOnDate.forEach(ev => {
        activeLeadStates[ev.leadId] = ev.status;
      });

      // Aggregate counts for active leads
      const statusCounts: Record<string, number> = {
        Nuevo: 0,
        'Por Contactar': 0,
        Contactado: 0,
        Propuesta: 0,
        Cerrado: 0,
        Perdido: 0,
        'Muy Moderno': 0
      };

      Object.entries(activeLeadStates).forEach(([leadId, status]) => {
        const label = labelMap[status] || 'Nuevo';
        if (statusCounts[label] !== undefined) {
          statusCounts[label] += 1;
        }
      });

      const dateObj = new Date(dateKey + 'T12:00:00'); // center of the day
      const formattedDate = dateObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

      return {
        fecha: formattedDate,
        ...statusCounts
      };
    });
  }, [savedLeads, getLeadDate]);

  if (savedLeads.length === 0) {
    return (
      <div className="col-span-12 py-20 bg-white border border-slate-150 rounded-[32px] text-center max-w-2xl mx-auto px-6 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-500 mb-6 shadow-inner">
          <Activity className="w-8 h-8 animate-pulse text-indigo-550" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sin Datos Estadísticos</h3>
        <p className="text-slate-500 font-semibold mt-2 text-sm leading-relaxed">
          Guarda primero algunos prospectos de negocios locales en la pestaña de <strong>Buscador</strong> para habilitar las gráficas analíticas y el monitoreo del CRM.
        </p>
      </div>
    );
  }

  return (
    <div className="col-span-12 space-y-8 text-left">
      
      {/* 1. Header Details */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-650" />
            Panel Ejecutivo & Estadísticas CRM
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5">Métricas de madurez comercial y tasas de conversión en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 p-1.5 rounded-2xl shrink-0 self-start md:self-auto text-xs font-bold">
          <Calendar className="w-3.5 h-3.5 text-slate-450 ml-1" />
          <span className="text-[10.5pt] text-slate-600 pr-1.5">Consolidado General</span>
        </div>
      </div>

      {/* 2. Top-level KPIs Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 bg-white border border-slate-150 rounded-[28px] shadow-xs hover:shadow-md transition-all duration-300 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">Leads Guardados</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">{kpis.total}</span>
            <span className="text-[10px] text-slate-450 font-bold block">Base de prospectos total</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
            <Users className="w-5 h-5 shadow-inner" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 bg-white border border-slate-150 rounded-[28px] shadow-xs hover:shadow-md transition-all duration-300 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">Tasa de Conclusión</span>
            <span className="text-2xl font-black text-emerald-600 tracking-tight block">{kpis.conversionRate}</span>
            <span className="text-[10px] text-slate-450 font-bold block">Leads marcados 'Cerrado'</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 bg-white border border-slate-150 rounded-[28px] shadow-xs hover:shadow-md transition-all duration-300 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">Embudo Activo</span>
            <span className="text-2xl font-black text-amber-550 tracking-tight block">{kpis.activePipeline}</span>
            <span className="text-[10px] text-slate-450 font-bold block">En negociación y contacto</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-550 rounded-2xl shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 bg-white border border-slate-150 rounded-[28px] shadow-xs hover:shadow-md transition-all duration-300 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">Puntaje de Madurez</span>
            <span className="text-2xl font-black text-indigo-650 tracking-tight block">{kpis.avgScore}/100</span>
            <span className="text-[10px] text-slate-450 font-bold block">Promedio de optimización</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* AreaChart: Cumulative Growth & New Leads */}
        <div className="lg:col-span-12 bg-white border border-slate-150 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Crecimiento de Leads Guardados
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Acumulación de contactos guardados en la base de datos local</p>
            </div>
          </div>
          
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNuevos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="fecha" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600}
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600}
                  tickLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0',
                    fontFamily: 'Inter sans-serif',
                    fontSize: '11px',
                    fontWeight: 600,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Total Acumulado" 
                  stroke="#6366f1" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Nuevos Leads" 
                  stroke="#3b82f6" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#colorNuevos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CRM Funnel Conversion Chart */}
        <div className="lg:col-span-6 bg-white border border-slate-150 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-0.5 mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-indigo-600" /> Conversión del Embudo CRM
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">Porcentaje de conversión acumulado desde prospecto inicial hasta venta cerrada</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart margin={{ top: 15, right: 30, left: 30, bottom: 15 }}>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    fontFamily: 'Inter sans-serif',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    const percent = props?.payload?.percent ?? 0;
                    const displayName = props?.payload?.name ?? name;
                    return [`${value} leads (${percent}%)`, displayName];
                  }}
                />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                  labelKey="name"
                >
                  <LabelList 
                    position="right" 
                    dataKey="percent" 
                    fill="#1e293b" 
                    fontSize={10} 
                    fontWeight={850} 
                    formatter={(val: number) => `${val}%`}
                  />
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          {/* conversion indicators details list */}
          <div className="grid grid-cols-5 gap-1 mt-4 text-[9px] font-bold text-slate-600 border-t border-slate-100 pt-3">
            {funnelData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <span className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: item.fill }} />
                <span className="text-slate-450 block font-black text-[8px] truncate max-w-full leading-tight">{item.name.split('. ')[1] || item.name}</span>
                <span className="text-slate-800 block text-[10.5px] font-black mt-0.5">{item.percent}%</span>
                <span className="text-slate-400 block font-bold text-[8.5px]">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current CRM Status Distribution: Pie / Donut Chart */}
        <div className="lg:col-span-6 bg-white border border-slate-150 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-0.5 mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-indigo-600" /> Distribución Actual CRM
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">Porcentaje de leads por fase del embudo comercial</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={currentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {currentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    fontFamily: 'Inter sans-serif',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            
            {/* Overlay Center Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-2xl font-black text-slate-800 leading-none">{kpis.total}</span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-0.5">Total Leads</span>
            </div>
          </div>

          {/* Labels indicators list */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold text-slate-600 border-t border-slate-100 pt-3">
            {currentStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stacked AreaChart: CRM Status progression over time */}
        <div className="lg:col-span-12 bg-white border border-slate-150 rounded-[32px] p-6 shadow-sm">
          <div className="space-y-0.5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Evolución del Tablero Comercial a lo Largo del Tiempo
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Distribución acumulada y movimiento de fases de tus prospectos de manera secuencial</p>
            </div>
          </div>

          <div className="h-80 w-full pt-4">
            {statusProgressionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={statusProgressionData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '16px', 
                      border: '1px solid #e2e8f0',
                      fontFamily: 'Inter sans-serif',
                      fontSize: '11px',
                      fontWeight: 750,
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '9px', fontWeight: 700, paddingTop: '15px' }}
                  />
                  {Object.entries(labelMap).map(([key, label]) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={label}
                      stackId="1"
                      stroke={colorMap[key]}
                      fill={colorMap[key]}
                      fillOpacity={0.7}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                Cargando historial de embudo...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
