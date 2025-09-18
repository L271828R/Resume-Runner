import React from 'react';
import { useQuery } from 'react-query';
import {
  Briefcase,
  FileText,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    () => fetch('/api/dashboard/stats').then(res => res.json())
  );

  const { data: recentActivity, isLoading: activityLoading } = useQuery(
    'recent-activity',
    () => fetch('/api/dashboard/recent-activity').then(res => res.json())
  );

  const { data: resumeMetrics, isLoading: resumeLoading } = useQuery(
    'resume-metrics',
    () => fetch('/api/resume-versions/success-metrics').then(res => res.json())
  );

  if (statsLoading || activityLoading || resumeLoading) {
    return <div>Loading dashboard...</div>;
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = '#3b82f6' }) => (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            {title}
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{
          background: `${color}15`,
          padding: '12px',
          borderRadius: '8px',
          color: color
        }}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-${status}`;
    return <span className={statusClass}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
          Dashboard
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
          Track your job search progress and optimize your applications
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <StatCard
          title="Total Applications"
          value={stats?.stats?.total_applications || 0}
          icon={Briefcase}
          color="#3b82f6"
        />
        <StatCard
          title="Interviews"
          value={stats?.stats?.interviews || 0}
          subtitle={`${stats?.stats?.interview_rate || 0}% success rate`}
          icon={CheckCircle}
          color="#10b981"
        />
        <StatCard
          title="Offers"
          value={stats?.stats?.offers || 0}
          subtitle={`${stats?.stats?.offer_rate || 0}% offer rate`}
          icon={TrendingUp}
          color="#f59e0b"
        />
        <StatCard
          title="Companies Tracked"
          value={stats?.stats?.companies_tracked || 0}
          icon={Building2}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-2">
        {/* Recent Activity */}
        <div className="card">
          <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            Recent Activity
          </h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {recentActivity?.recent_activity?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentActivity.recent_activity.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '6px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                        {activity.position_title}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        at {activity.company_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {getStatusBadge(activity.status)}
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {format(new Date(activity.application_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
                No applications yet. Start tracking your job search!
              </div>
            )}
          </div>
        </div>

        {/* Resume Performance */}
        <div className="card">
          <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            Resume Performance
          </h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {resumeMetrics?.success_metrics?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {resumeMetrics.success_metrics.map((metric) => (
                  <div
                    key={metric.id}
                    style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {metric.version_name}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: metric.interview_rate > 20 ? '#10b981' : '#6b7280'
                      }}>
                        {metric.interview_rate || 0}% interview rate
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      <span>{metric.total_applications || 0} applications</span>
                      <span>{metric.interviews || 0} interviews</span>
                      <span>{metric.offers || 0} offers</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
                No resume metrics yet. Add some resume versions!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;