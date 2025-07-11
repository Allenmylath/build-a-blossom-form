import React, { useState, useEffect } from 'react';
import { FormField } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, Clock, AlertCircle, CheckCircle, LogIn, Globe } from 'lucide-react';
import { format, addDays, isSameDay, isAfter, isBefore, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface AppointmentBookingFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  formId?: string;
}

export const AppointmentBookingField: React.FC<AppointmentBookingFieldProps> = ({
  field,
  value,
  onChange,
  error,
  formId
}) => {
  const { user } = useSupabaseAuth();
  const { isConnected, calendarEmail, loading } = useCalendarIntegration(user);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value?.date ? new Date(value.date) : undefined);
  const [selectedTime, setSelectedTime] = useState<string>(value?.time || '');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userTimezone, setUserTimezone] = useState<string>('');

  // Detect user timezone
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
  }, []);

  // Default configuration
  const config = field.appointmentConfig || {
    duration: 30,
    workingHours: { start: '09:00', end: '17:00' },
    bookingNotice: 'Please select your preferred date and time for the appointment.'
  };

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMinute] = config.workingHours!.start.split(':').map(Number);
    const [endHour, endMinute] = config.workingHours!.end.split(':').map(Number);
    
    let currentTime = setMinutes(setHours(new Date(), startHour), startMinute);
    const endTime = setMinutes(setHours(new Date(), endHour), endMinute);
    
    while (isBefore(currentTime, endTime)) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addDays(currentTime, 0);
      currentTime.setMinutes(currentTime.getMinutes() + (config.duration || 30));
    }
    
    return slots;
  };

  const timeSlots = config.availableTimeSlots || generateTimeSlots();

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !formId || !user) return;

    setBookingStatus('booking');
    setErrorMessage('');
    
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      // Call the edge function to create the calendar event
      const { data, error } = await supabase.functions.invoke('create-calendar-event', {
        body: {
          formId,
          fieldId: field.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          duration: config.duration || 30,
          title: field.label,
          description: config.bookingNotice || 'Appointment booked through form',
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Calendar booking error:', error);
        throw new Error(error.message || 'Failed to book appointment');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create calendar event');
      }
      
      const appointmentData = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        duration: config.duration,
        status: 'booked',
        bookedAt: new Date().toISOString(),
        calendarEventId: data.event?.id,
        calendarEventLink: data.event?.htmlLink,
      };
      
      onChange(appointmentData);
      setBookingStatus('success');
    } catch (error: any) {
      console.error('Booking error:', error);
      setErrorMessage(error.message || 'Failed to book appointment. Please try again.');
      setBookingStatus('error');
    }
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates and weekends (basic example)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today) || date.getDay() === 0 || date.getDay() === 6;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Checking calendar integration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            {field.label}
            <Badge variant="secondary" className="ml-2">Sign-in Required</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <LogIn className="h-4 w-4" />
            <AlertDescription className="mb-4">
              Please sign in to book appointments through Google Calendar integration.
            </AlertDescription>
          </Alert>
          <Link to="/auth">
            <Button className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Book Appointment
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="w-full opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            {field.label}
            <Badge variant="secondary" className="ml-2">Inactive</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Google Calendar integration is required to book appointments. Please connect your calendar in the settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (bookingStatus === 'success') {
    return (
      <Card className="w-full border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-2" />
            <div>
              <h3 className="font-semibold">Appointment Booked Successfully!</h3>
              <p className="text-sm">
                Your appointment is scheduled for {format(selectedDate!, 'MMMM d, yyyy')} at {selectedTime}
              </p>
              {calendarEmail && (
                <p className="text-xs mt-1">
                  Calendar event created in {calendarEmail}
                  {value?.calendarEventLink && (
                    <a 
                      href={value.calendarEventLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      (View in Calendar)
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          {field.label}
          <Badge variant="outline" className="ml-2">Active</Badge>
        </CardTitle>
        {config.bookingNotice && (
          <p className="text-sm text-muted-foreground">{config.bookingNotice}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timezone Info */}
        {userTimezone && (
          <div className="flex items-center justify-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            <Globe className="w-4 h-4 mr-2" />
            <span>Times shown in your timezone: {userTimezone}</span>
          </div>
        )}

        {/* Date Selection */}
        <div className="space-y-4">
          <h4 className="font-semibold text-center text-lg flex items-center justify-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Select Date
          </h4>
          <div className="flex justify-center">
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                className="rounded-xl border-none shadow-none bg-transparent"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-base font-semibold",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-accent rounded-lg transition-colors",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors",
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="space-y-4">
            <h4 className="font-semibold text-center text-lg flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Select Time
            </h4>
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className={cn(
                    "h-12 rounded-xl border-border/50 bg-card shadow-lg text-center font-medium",
                    error ? 'border-destructive' : '',
                    selectedTime ? 'bg-primary/5 border-primary/20' : ''
                  )}>
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-xl">
                    {timeSlots.map((time) => (
                      <SelectItem 
                        key={time} 
                        value={time}
                        className="rounded-lg mx-1 my-0.5 font-medium hover:bg-accent/80 focus:bg-accent/80"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{time}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {config.duration}min
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Booking Summary */}
        {selectedDate && selectedTime && (
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6 shadow-lg">
            <h4 className="font-semibold text-lg mb-4 text-center flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Appointment Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="font-medium text-muted-foreground">Date:</span>
                <span className="font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="font-medium text-muted-foreground">Time:</span>
                <span className="font-semibold">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="font-medium text-muted-foreground">Duration:</span>
                <span className="font-semibold">{config.duration} minutes</span>
              </div>
              {calendarEmail && (
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-muted-foreground">Calendar:</span>
                  <span className="font-semibold text-sm">{calendarEmail}</span>
                </div>
              )}
              {userTimezone && (
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-muted-foreground">Timezone:</span>
                  <span className="font-semibold text-sm">{userTimezone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Book Button */}
        <Button
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime || bookingStatus === 'booking'}
          className="w-full"
        >
          {bookingStatus === 'booking' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Booking Appointment...
            </>
          ) : (
            'Book Appointment'
          )}
        </Button>

        {bookingStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || 'Failed to book appointment. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  );
};