type State = 'loading' | 'error' | 'success';
interface User {
  uid: string;
  email: string | null;
  name: string | null;
  pfp: string | null;
}
type Page = 'home' | 'anime' | 'watch';
