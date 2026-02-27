import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import { Button, Card, Badge } from '../common';
import { useAuth } from '../../context/AuthContext';
import { getTimezone, getCountryByCode, getCurrentTimeInTimezone } from '../../utils/currency';

const AttendanceWidget = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState({
    currentState: 'not_checked_in',
    totalWorkingMinutes: 0,
    totalBreakMinutes: 0,
    workSessions: [],
    personalBreaks: [],
    lunchBreak: null,
  });
  const [employee, setEmployee] = useState(null);

  // Get user's work location for timezone
  const workLocation = user?.workLocation || employee?.workLocation || 'IN';
  const userTimezone = getTimezone(workLocation);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchStatus();
    // Set up interval to refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await attendanceService.getMyStatus();
      setStatus(response.data.attendance);
      setEmployee(response.data.employee);
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, ...args) => {
    setActionLoading(true);
    try {
      let response;
      switch (action) {
        case 'checkIn':
          response = await attendanceService.checkIn();
          toast.success('Checked in successfully!');
          break;
        case 'checkOut':
          response = await attendanceService.checkOut();
          toast.success('Checked out successfully!');
          break;
        case 'startLunch':
          response = await attendanceService.startLunch();
          toast.success('Lunch break started');
          break;
        case 'endLunch':
          response = await attendanceService.endLunch();
          toast.success('Lunch break ended');
          break;
        case 'startBreak':
          response = await attendanceService.startBreak(args[0] || '');
          toast.success('Personal break started');
          break;
        case 'endBreak':
          response = await attendanceService.endBreak();
          toast.success('Personal break ended');
          break;
      }
      if (response?.data?.attendance) {
        setStatus(response.data.attendance);
      } else {
        fetchStatus();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Format time with hours, minutes, and seconds
  const formatTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds === 0) return '0h 0m 0s';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Calculate real-time working seconds
  const calculateWorkingSeconds = () => {
    let totalSeconds = (status.totalWorkingMinutes || 0) * 60;

    // If currently working, add time elapsed since last check-in
    if (status.currentState === 'working' && status.workSessions?.length > 0) {
      const lastSession = status.workSessions[status.workSessions.length - 1];
      if (lastSession?.checkIn) {
        const checkInTime = new Date(lastSession.checkIn).getTime();
        const elapsedSeconds = Math.floor((currentTime.getTime() - checkInTime) / 1000);
        totalSeconds += elapsedSeconds;
      }
    }

    return totalSeconds;
  };

  // Calculate real-time break seconds
  const calculateBreakSeconds = () => {
    let totalSeconds = (status.totalBreakMinutes || 0) * 60;

    // If currently on break, add time elapsed since break started
    if (status.currentState === 'lunch_break' && status.lunchBreak?.start) {
      const breakStart = new Date(status.lunchBreak.start).getTime();
      const elapsedSeconds = Math.floor((currentTime.getTime() - breakStart) / 1000);
      totalSeconds += elapsedSeconds;
    }

    if (status.currentState === 'personal_break' && status.personalBreaks?.length > 0) {
      const lastBreak = status.personalBreaks[status.personalBreaks.length - 1];
      if (lastBreak?.out && !lastBreak?.in) {
        const breakStart = new Date(lastBreak.out).getTime();
        const elapsedSeconds = Math.floor((currentTime.getTime() - breakStart) / 1000);
        totalSeconds += elapsedSeconds;
      }
    }

    return totalSeconds;
  };

  // Get current time string with seconds in user's timezone
  const getCurrentTimeStr = () => {
    try {
      return currentTime.toLocaleTimeString('en-US', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    }
  };

  // Get last check-in time in user's timezone
  const getLastCheckInTime = () => {
    if (status.workSessions?.length > 0) {
      const lastSession = status.workSessions[status.workSessions.length - 1];
      if (lastSession?.checkIn) {
        try {
          return new Date(lastSession.checkIn).toLocaleTimeString('en-US', {
            timeZone: userTimezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
        } catch (e) {
          return new Date(lastSession.checkIn).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
        }
      }
    }
    return null;
  };

  const getStateColor = () => {
    const colors = {
      not_checked_in: 'gray',
      working: 'emerald',
      lunch_break: 'amber',
      personal_break: 'orange',
      checked_out: 'blue',
    };
    return colors[status.currentState] || 'gray';
  };

  const getStateLabel = () => {
    const labels = {
      not_checked_in: 'Not Checked In',
      working: 'Working',
      lunch_break: 'On Lunch Break',
      personal_break: 'On Personal Break',
      checked_out: 'Checked Out',
    };
    return labels[status.currentState] || 'Unknown';
  };

  const getStateIcon = () => {
    switch (status.currentState) {
      case 'working':
        return (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        );
      case 'lunch_break':
      case 'personal_break':
        return (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-40 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today's Attendance</h3>
        <div className="flex items-center gap-2">
          {getStateIcon()}
          <Badge variant={getStateColor() === 'emerald' ? 'success' : getStateColor() === 'amber' ? 'warning' : 'default'}>
            {getStateLabel()}
          </Badge>
        </div>
      </div>

      {/* Current Time Display */}
      <div className="text-center mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4">
        <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 font-mono tracking-tight">
          {getCurrentTimeStr()}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {(() => {
            try {
              return currentTime.toLocaleDateString('en-US', {
                timeZone: userTimezone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
            } catch (e) {
              return currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
            }
          })()}
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
          📍 {getCountryByCode(workLocation)?.name} ({userTimezone})
        </div>
        {getLastCheckInTime() && status.currentState === 'working' && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
            Started at {getLastCheckInTime()}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Working Time</div>
              <div className="text-xl font-bold text-green-700 dark:text-green-300 font-mono mt-1">
                {formatTime(calculateWorkingSeconds())}
              </div>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">Break Time</div>
              <div className="text-xl font-bold text-amber-700 dark:text-amber-300 font-mono mt-1">
                {formatTime(calculateBreakSeconds())}
              </div>
            </div>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons based on current state */}
      <div className="space-y-2">
        {status.currentState === 'not_checked_in' && (
          <Button
            className="w-full"
            onClick={() => handleAction('checkIn')}
            loading={actionLoading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Check In (Start Work)
          </Button>
        )}

        {status.currentState === 'working' && (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="col-span-1"
              onClick={() => handleAction('startLunch')}
              loading={actionLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lunch
            </Button>
            <Button
              variant="outline"
              className="col-span-1"
              onClick={() => handleAction('startBreak', 'Personal work')}
              loading={actionLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Break
            </Button>
            <Button
              variant="secondary"
              className="col-span-1"
              onClick={() => handleAction('checkOut')}
              loading={actionLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Out
            </Button>
          </div>
        )}

        {status.currentState === 'lunch_break' && (
          <Button
            className="w-full"
            onClick={() => handleAction('endLunch')}
            loading={actionLoading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            End Lunch Break
          </Button>
        )}

        {status.currentState === 'personal_break' && (
          <Button
            className="w-full"
            onClick={() => handleAction('endBreak')}
            loading={actionLoading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Back to Work
          </Button>
        )}

        {status.currentState === 'checked_out' && (
          <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Already checked out for today</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total: {formatTime(status.totalWorkingMinutes * 60)}</p>
          </div>
        )}
      </div>

      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-8 -mt-8" />
    </Card>
  );
};

export default AttendanceWidget;