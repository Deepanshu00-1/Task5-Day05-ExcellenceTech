import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isUserOrganizer(): boolean {
  // Check local storage first
  const isOrganizerFromStorage = localStorage.getItem('isOrganizer') === 'true';
  
  // Check if the current user is our hardcoded organizer (test@organizer.com)
  const currentEmail = localStorage.getItem('userEmail');
  const isHardcodedOrganizer = currentEmail === 'test@organizer.com';
  
  // Return true if either condition is met
  return isOrganizerFromStorage || isHardcodedOrganizer;
}
