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
import { CalendarIcon, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addDays, isSameDay, isAfter, isBefore, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

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
      <CardContent className="space-y-4">
        {/* Date Selection */}
        <div>
          <h4 className="font-medium mb-2">Select Date</h4>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            className="rounded-md border"
          />
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Select Time
            </h4>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time} ({config.duration} minutes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Booking Summary */}
        {selectedDate && selectedTime && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Appointment Summary</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Duration:</strong> {config.duration} minutes</p>
              {calendarEmail && (
                <p><strong>Calendar:</strong> {calendarEmail}</p>
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