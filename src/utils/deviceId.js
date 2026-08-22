// Anonymous device ID generator
// Uses localStorage for persistence without requiring authentication

import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'roadguard_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${uuidv4().slice(0, 12)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
