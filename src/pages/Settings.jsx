import ProfileSection from '../components/settings/ProfileSection';

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <p className="text-xs text-base-content/40 uppercase tracking-widest font-medium mb-6">Profile</p>
      <ProfileSection />
    </div>
  );
}
