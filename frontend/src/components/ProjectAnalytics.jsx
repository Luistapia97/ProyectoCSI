import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, CheckCircle, AlertCircle, Users, Calendar } from 'lucidereact';
import './ProjectAnalytics.css';

const COLORS = {
  pendiente: '#f59e0b',
  progreso: '#3b82f6',
  completado: '#22c55e',
  baja: '#10b981',
  media: '#f59e0b',
  alta: '#ef4444',
  urgente: '#dc2626',
};

export default function ProjectAnalytics({ tasks, project }) {
  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = tasks.length;
    const pendientes = tasks.filter(t => t.column.toLowerCase().includes('pendiente')).length;
    const enProgreso = tasks.filter(t => t.column.toLowerCase().includes('progreso')).length;
    const completadas = tasks.filter(t => t.completed || t.column.toLowerCase().includes('completad')).length;
    const vencidas = tasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const progresoGeneral = total > 0 ? Math.round((completadas / total) * 100) : 0;

    return {
      total,
      pendientes,
      enProgreso,
      completadas,
      vencidas,
      progresoGeneral,
    };
  }, [tasks]);

  // Datos para gráfico de estado (Pie)
  const estadoData = [
    { name: 'Pendiente', value: stats.pendientes, color: COLORS.pendiente },
    { name: 'En Progreso', value: stats.enProgreso, color: COLORS.progreso },
    { name: 'Completado', value: stats.completadas, color: COLORS.completado },
  ].filter(item => item.value > 0);

  // Datos para gráfico de prioridad (Bar)
  const prioridadData = [
    { name: 'Baja', value: tasks.filter(t => t.priority === 'baja').length, color: COLORS.baja },
    { name: 'Media', value: tasks.filter(t => t.priority === 'media').length, color: COLORS.media },
    { name: 'Alta', value: tasks.filter(t => t.priority === 'alta').length, color: COLORS.alta },
    { name: 'Urgente', value: tasks.filter(t => t.priority === 'urgente').length, color: COLORS.urgente },
  ];

  // Datos para gráfico de tareas por usuario
  const tareasUsuarioData = useMemo(() => {
    const userTaskCount = {};
    
    tasks.forEach(task => {
      if (task.assignedTo && task.assignedTo.length > 0) {
        task.assignedTo.forEach(user => {
          if (!userTaskCount[user.name]) {
            userTaskCount[user.name] = { total: 0, completadas: 0 };
          }
          userTaskCount[user.name].total++;
          if (task.completed) {
            userTaskCount[user.name].completadas++;
          }
        });
      }
    });

    return Object.entries(userTaskCount).map(([name, data]) => ({
      name,
      total: data.total,
      completadas: data.completadas,
      pendientes: data.total  data.completadas,
    }));
  }, [tasks]);

  // Datos para tendencia temporal (últimos 7 días)
  const tendenciaData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i) {
      const date = new Date(today);
      date.setDate(date.getDate()  i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completadasHastaFecha = tasks.filter(t => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
        return completedDate <= dateStr;
      }).length;

      last7Days.push({
        fecha: date.toLocaleDateString('esES', { day: '2digit', month: 'short' }),
        completadas: completadasHastaFecha,
      });
    }
    
    return last7Days;
  }, [tasks]);

  return (
    <div className="analyticscontainer">
      <div className="analyticsheader">
        <h2>📊 Análisis del Proyecto</h2>
        <p>Estadísticas y métricas de desempeño</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="statscards">
        <div className="statcard">
          <div className="staticon" style={{ background: 'lineargradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="statcontent">
            <span className="statvalue">{stats.progresoGeneral}%</span>
            <span className="statlabel">Progreso General</span>
          </div>
        </div>

        <div className="statcard">
          <div className="staticon" style={{ background: 'lineargradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="statcontent">
            <span className="statvalue">{stats.completadas}</span>
            <span className="statlabel">Tareas Completadas</span>
          </div>
        </div>

        <div className="statcard">
          <div className="staticon" style={{ background: 'lineargradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Clock size={24} />
          </div>
          <div className="statcontent">
            <span className="statvalue">{stats.enProgreso}</span>
            <span className="statlabel">En Progreso</span>
          </div>
        </div>

        <div className="statcard">
          <div className="staticon" style={{ background: 'lineargradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <AlertCircle size={24} />
          </div>
          <div className="statcontent">
            <span className="statvalue">{stats.vencidas}</span>
            <span className="statlabel">Tareas Vencidas</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="chartsgrid">
        {/* Gráfico de estado (Pie) */}
        <div className="chartcard">
          <h3>Estado de Tareas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={estadoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {estadoData.map((entry, index) => (
                  <Cell key={`cell${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de prioridad (Bar) */}
        <div className="chartcard">
          <h3>Tareas por Prioridad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={prioridadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {prioridadData.map((entry, index) => (
                  <Cell key={`cell${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de tareas por usuario */}
        {tareasUsuarioData.length > 0 && (
          <div className="chartcard chartcardwide">
            <h3>Tareas por Usuario</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tareasUsuarioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completadas" stackId="a" fill="#22c55e" name="Completadas" />
                <Bar dataKey="pendientes" stackId="a" fill="#f59e0b" name="Pendientes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de tendencia */}
        <div className="chartcard chartcardwide">
          <h3>Tendencia de Completación (últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tendenciaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completadas" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Tareas Completadas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de resumen */}
      <div className="summarytable">
        <h3>Resumen Detallado</h3>
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Valor</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="metricname">Total de Tareas</span></td>
              <td><strong>{stats.total}</strong></td>
              <td>100%</td>
            </tr>
            <tr>
              <td><span className="metricname">Pendientes</span></td>
              <td>{stats.pendientes}</td>
              <td>{stats.total > 0 ? Math.round((stats.pendientes / stats.total) * 100) : 0}%</td>
            </tr>
            <tr>
              <td><span className="metricname">En Progreso</span></td>
              <td>{stats.enProgreso}</td>
              <td>{stats.total > 0 ? Math.round((stats.enProgreso / stats.total) * 100) : 0}%</td>
            </tr>
            <tr className="highlightrow">
              <td><span className="metricname">Completadas</span></td>
              <td><strong>{stats.completadas}</strong></td>
              <td><strong>{stats.progresoGeneral}%</strong></td>
            </tr>
            <tr className="dangerrow">
              <td><span className="metricname">Vencidas</span></td>
              <td>{stats.vencidas}</td>
              <td>{stats.total > 0 ? Math.round((stats.vencidas / stats.total) * 100) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

