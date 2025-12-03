import { useState } from 'react';

type AlerteeResponse = '' | 'WAITING' | 'YES';

interface Alertee {
  name: string;
  response: AlerteeResponse;
  indentLevel?: number; // For indentation (0, 1, 2)
}

const [alertees, setAlertees] = useState<Alertee[]>([
  { name: 'Zunairah', response: '', indentLevel: 0 },
  { name: 'Mahnoor', response: '', indentLevel: 0 },
  { name: 'Ahmad', response: '', indentLevel: 1 },
  { name: 'Zain', response: '', indentLevel: 2 },
]);

