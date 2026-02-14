import Navbar from './components/Navbar';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <>
      <Navbar />
      <Outlet /> {/* This renders the current route's component */}
    </>
  );
}