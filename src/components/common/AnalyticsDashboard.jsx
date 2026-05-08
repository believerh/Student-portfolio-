import React, { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FileText, Users, Upload, MessageSquare, Heart } from 'lucide-react';

const COLORS = ['#22d3ee', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
const FILE_COLORS = { video: '#22d3ee', image: '#a855f7', text: '#22c55e', audio: '#f59e0b' };

const AnalyticsDashboard = ({
  students = [],
  teachers = [],
  files = {},
  comments = {},
  likes = {},
  shares = [],
}) => {
  // Flatten all files with owner info
  const allFiles = useMemo(() =>
    Object.entries(files).flatMap(([userId, fileList]) =>
      fileList.map(f => ({ ...f, userId }))
    ),
    [files]
  );

  // File type distribution (pie chart data)
  const fileTypeData = useMemo(() => {
    const counts = { video: 0, image: 0, text: 0, audio: 0 };
    allFiles.forEach(f => { if (counts[f.type] !== undefined) counts[f.type]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [allFiles]);

  // Uploads per student (bar chart data)
  const uploadsPerStudent = useMemo(() => {
    const studentFileMap = {};
    students.forEach(s => { studentFileMap[s.id] = { name: s.name, uploads: 0 }; });
    allFiles.forEach(f => {
      if (studentFileMap[f.userId]) studentFileMap[f.userId].uploads++;
    });
    return Object.values(studentFileMap)
      .filter(s => s.uploads > 0)
      .sort((a, b) => b.uploads - a.uploads)
      .slice(0, 10);
  }, [allFiles, students]);

  // Upload activity over time (line chart data)
  const uploadActivity = useMemo(() => {
    const monthly = {};
    allFiles.forEach(f => {
      if (f.created_at) {
        const date = new Date(f.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + 1;
      }
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, uploads: count }));
  }, [allFiles]);

  // Engagement stats
  const totalComments = useMemo(() =>
    Object.values(comments).reduce((sum, list) => sum + list.length, 0),
    [comments]
  );
  const totalLikes = useMemo(() =>
    Object.values(likes).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0),
    [likes]
  );
  const totalShares = shares?.length || 0;
  const activeStudents = useMemo(() =>
    new Set(allFiles.map(f => f.userId)).size,
    [allFiles]
  );

  const statCards = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Total Teachers', value: teachers.length, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Files', value: allFiles.length, icon: Upload, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Active Uploaders', value: activeStudents, icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Total Comments', value: totalComments, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Likes', value: totalLikes, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Total Shares', value: totalShares, icon: Heart, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-cyan-400 mb-6 pb-4 border-b border-cyan-500/30">
        {'//'} ANALYTICS_DASHBOARD_
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border border-gray-800 rounded-lg p-4 text-center`}>
            <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uploads Per Student (Bar Chart) */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-cyan-400 font-medium mb-4">{'//'} UPLOADS_PER_STUDENT_</h3>
          {uploadsPerStudent.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upload data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={uploadsPerStudent}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#22d3ee' }}
                />
                <Bar dataKey="uploads" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* File Type Distribution (Pie Chart) */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-cyan-400 font-medium mb-4">{'//'} FILE_TYPE_DISTRIBUTION_</h3>
          {fileTypeData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No file data yet</p>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={280}>
                <PieChart>
                  <Pie
                    data={fileTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {fileTypeData.map((entry, i) => (
                      <Cell key={entry.name} fill={FILE_COLORS[entry.name.toLowerCase()] || COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[40%] space-y-2">
                {fileTypeData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{entry.name}</span>
                    <span className="text-white font-mono">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Over Time (Line Chart) */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-cyan-400 font-medium mb-4">{'//'} UPLOAD_ACTIVITY_OVER_TIME_</h3>
        {uploadActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={uploadActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#22d3ee' }}
              />
              <Line type="monotone" dataKey="uploads" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
