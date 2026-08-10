import { useNavigate } from 'react-router-dom';
import { minidenticon } from 'minidenticons';

export default function ContactRow({ contact, profile }) {
  const profilePhoto = profile?.profile_photo;
  const navigate = useNavigate();
  const identiconSvg = minidenticon(contact.friendUser);
  const identiconUrl = `data:image/svg+xml;utf8,${encodeURIComponent(identiconSvg)}`;

  return (
    <div className="flex items-center gap-3.5 px-4 py-3 rounded-[10px] border border-base-content/[0.06] bg-base-300 hover:bg-base-content/[0.06] transition-colors">
      <div className="avatar shrink-0">
        <div className="w-10 rounded-full">
          <img
            src={profilePhoto || identiconUrl}
            alt={contact.friendUser}
            className="w-10 h-10 rounded-full"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {profile?.name && <p className="font-semibold text-sm text-base-content truncate">{profile.name}</p>}
        <p className={`truncate ${profile?.name ? 'text-xs text-base-content/40' : 'font-semibold text-sm text-base-content'}`}>@{contact.friendUser}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          className="btn btn-primary btn-sm font-semibold rounded-full px-4 hover:shadow-[0_0_12px_rgba(34,197,94,0.25)]"
          onClick={() => navigate(`/trade?tab=transfer&to=@${contact.friendUser}`)}
        >
          Pay
        </button>
        <button
          className="border border-base-content/20 text-base-content rounded-full px-3 py-1 text-sm hover:bg-base-content/5 transition-colors"
          onClick={() => navigate(`/trade?tab=request&to=@${contact.friendUser}`)}
        >
          Request
        </button>
        <div className="dropdown dropdown-end">
          <button tabIndex={0} className="p-2 rounded-full hover:bg-base-content/10 transition" title="More options">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-base-content/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </button>
          <ul tabIndex={0} className="dropdown-content menu menu-sm bg-base-200 rounded-box shadow-lg border border-base-content/10 z-10 w-48 p-1">
            <li>
              <button className="text-error" onClick={() => { /* TODO */ }}>
                Remove connection
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
