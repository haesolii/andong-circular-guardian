import { redirect } from 'next/navigation';
export default function FieldPage() {
  redirect(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001/'
      : 'https://deulnyeok-field.roy919491.chatgpt.site/',
  );
}
