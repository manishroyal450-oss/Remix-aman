import { useState, useEffect, FormEvent } from 'react';
import { UserProfile } from '../data';
import { User, MapPin, Phone, CheckCircle2, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

interface ProfileSectionProps {
  onProfileSave?: (profile: UserProfile) => void;
  showNotification: (message: string) => void;
}

export default function ProfileSection({ onProfileSave, showNotification }: ProfileSectionProps) {
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    lastName: '',
    address: '',
    pinCode: '',
    contactNumber: '',
  });

  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load existing profile from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aman_sweet_profile');
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        setSavedProfile(parsed);
        setProfile(parsed);
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const fullNameTrimmed = profile.fullName.trim();
    const lastNameTrimmed = profile.lastName.trim();
    const addressTrimmed = profile.address.trim();
    const pinCodeTrimmed = profile.pinCode.trim();
    const contactNumberTrimmed = profile.contactNumber.trim();

    // Required fields check
    if (!fullNameTrimmed) {
      setFormError('Please enter your Full Name.');
      return;
    }
    if (!lastNameTrimmed) {
      setFormError('Please enter your Last Name.');
      return;
    }
    if (!addressTrimmed) {
      setFormError('Please enter your Address.');
      return;
    }
    if (!pinCodeTrimmed) {
      setFormError('Please enter your Pin code.');
      return;
    }
    if (!/^\d{6}$/.test(pinCodeTrimmed)) {
      setFormError('Pin code must be exactly 6 digits.');
      return;
    }
    if (!contactNumberTrimmed) {
      setFormError('Please enter your Contact Number.');
      return;
    }
    if (!/^\d{10}$/.test(contactNumberTrimmed.replace(/[^0-9]/g, ''))) {
      setFormError('Contact Number must be a valid 10-digit number.');
      return;
    }

    const updatedProfile: UserProfile = {
      fullName: fullNameTrimmed,
      lastName: lastNameTrimmed,
      address: addressTrimmed,
      pinCode: pinCodeTrimmed,
      contactNumber: contactNumberTrimmed,
    };

    try {
      localStorage.setItem('aman_sweet_profile', JSON.stringify(updatedProfile));
      setSavedProfile(updatedProfile);
      setIsSuccess(true);
      showNotification('Profile created successfully!');
      if (onProfileSave) {
        onProfileSave(updatedProfile);
      }
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save profile', err);
      setFormError('Failed to save profile to local storage.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header card */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur">
            <User size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Customer Profile</h2>
            <p className="text-xs text-teal-100 mt-0.5">
              Save your delivery address & details for faster ordering
            </p>
          </div>
        </div>

        {savedProfile && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-200">
              <UserCheck size={16} />
              <span>Profile Active: <strong>{savedProfile.fullName} {savedProfile.lastName}</strong></span>
            </div>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px]">Saved</span>
          </div>
        )}
      </div>

      {/* Success banner */}
      {isSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-fadeIn">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Profile saved successfully!</p>
            <p className="text-xs text-emerald-600">Your details are ready and will be used for delivery orders.</p>
          </div>
        </div>
      )}

      {/* Error alert */}
      {formError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="font-medium">{formError}</p>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        {/* Full Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="profile-fullname"
                placeholder="First / Full Name"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full pl-3.5 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="profile-lastname"
              placeholder="Last Name"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full pl-3.5 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
            <MapPin size={13} className="text-gray-400" />
            <span>Address</span> <span className="text-red-500">*</span>
          </label>
          <textarea
            id="profile-address"
            rows={3}
            placeholder="House/Shop No., Street, Colony, Landmark, Area"
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition resize-none"
          />
        </div>

        {/* Pin Code & Contact Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Pin code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="profile-pincode"
              maxLength={6}
              placeholder="e.g. 110001 (6 digits)"
              value={profile.pinCode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setProfile({ ...profile, pinCode: val });
              }}
              className="w-full pl-3.5 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <Phone size={13} className="text-gray-400" />
              <span>Contact number</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="profile-contact"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={profile.contactNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setProfile({ ...profile, contactNumber: val });
              }}
              className="w-full pl-3.5 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Bottom Button in GREEN COLOR as explicitly requested */}
        <div className="pt-4">
          <button
            type="submit"
            id="create-profile-btn"
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-green-600/25 transition flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <ShieldCheck size={20} />
            <span>Create a profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
