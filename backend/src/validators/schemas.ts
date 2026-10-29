export interface ValidationError {
  field: string;
  message: string;
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateEventInput = (data: any): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push({ field: 'name', message: 'Event name is required.' });
  }

  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    errors.push({ field: 'description', message: 'Event description is required.' });
  }

  if (!data.date) {
    errors.push({ field: 'date', message: 'Event date is required.' });
  } else {
    const d = new Date(data.date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'date', message: 'Valid event date is required.' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateParticipantInput = (data: any): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push({ field: 'name', message: 'Participant name is required.' });
  }

  if (!data.email || typeof data.email !== 'string' || !validateEmail(data.email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
