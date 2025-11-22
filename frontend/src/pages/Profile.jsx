import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
// DISABLED: storage import removed (avatar upload disabled)
// import { db, storage } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// DISABLED: updateProfile/reload imports commented out (avatar upload disabled)
// import { updateProfile, reload } from 'firebase/auth';
// DISABLED: Storage upload imports commented out (avatar upload disabled)
// import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
// import { auth } from '../config/firebase';
import { toast } from 'react-toastify';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import { User, Camera, Save, Github, Linkedin, FileText, Edit2, X, Briefcase, Building2, Link2 } from 'lucide-react';
import { useReports } from '../contexts/ReportContext';

export default function Profile() {
  const { currentUser } = useAuth();
  const { reports } = useReports();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    bio: '',
    role: '',
    organization: '',
    github: '',
    linkedin: '',
    website: '',
    resumeUrl: '',
  });
  const [photoURL, setPhotoURL] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ totalScans: 0, reportsSaved: 0, queued: 0 });
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const defaults = {
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
      };
      setFormData(prev => ({ ...prev, ...defaults }));
      setOriginalData(prev => ({ ...(prev || {}), ...defaults }));
      // Set photoURL from currentUser first
      if (currentUser.photoURL) {
        setPhotoURL(currentUser.photoURL);
      }

      const loadProfile = async () => {
        try {
          const profileRef = doc(db, 'profiles', currentUser.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            setFormData(prev => {
              const merged = { ...prev, ...data };
              setOriginalData(merged);
              return merged;
            });
            // Prefer Firestore photoURL if it exists, otherwise use currentUser.photoURL
            if (data.photoURL) {
              setPhotoURL(data.photoURL);
            } else if (currentUser.photoURL) {
              setPhotoURL(currentUser.photoURL);
            } else {
              setPhotoURL('');
            }
          } else {
            // If no Firestore profile, use currentUser.photoURL
            setPhotoURL(currentUser.photoURL || '');
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          // Fallback to currentUser.photoURL on error
          setPhotoURL(currentUser.photoURL || '');
        }
      };
      loadProfile();
    } else {
      setPhotoURL('');
    }
  }, [currentUser]);


  useEffect(() => {
    setStats({
      totalScans: reports.length,
      reportsSaved: reports.length,
      queued: 0,
    });
  }, [reports]);

  // DISABLED: Client-side avatar upload (admin-managed only)
  // To re-enable: Set REACT_APP_ALLOW_AVATAR_UPLOAD=true in .env
  const handlePhotoUpload = async (e) => {
    console.log('[RemovePFP] client-side avatar upload suppressed (admin-managed)');
    
    // Check if upload is allowed via environment variable
    if (process.env.REACT_APP_ALLOW_AVATAR_UPLOAD === 'true') {
      console.log('[RemovePFP] Upload attempted but code is disabled (admin-managed only)');
      toast.info('Avatar uploads are disabled. Contact an administrator to update your avatar.');
      return;
    }
    
    // Suppress upload attempt (default behavior)
    console.log('[RemovePFP] client-side avatar upload suppressed (admin-managed)');
    toast.info('Avatar uploads are disabled. Contact an administrator to update your avatar.');
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    /* ORIGINAL UPLOAD CODE (DISABLED - Admin-managed only)
    const file = e.target.files?.[0];
    if (!file || !currentUser) {
      if (!currentUser) {
        toast.error('Please log in to upload a profile picture');
      }
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB as per requirements)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const avatarPath = `avatars/${currentUser.uid}.jpg`;
      
      // Delete old photo if exists (use the known path, not the URL)
      try {
        const oldPhotoRef = ref(storage, avatarPath);
        await deleteObject(oldPhotoRef);
        console.log('[Profile] Old photo deleted successfully');
      } catch (deleteError) {
        // Ignore if file doesn't exist (404) or other non-critical errors
        if (deleteError.code !== 'storage/object-not-found') {
          console.warn('[Profile] Could not delete old photo:', deleteError);
        }
      }

      // Upload new photo using resumable upload for better reliability
      console.log('[Profile] Uploading photo to:', avatarPath);
      const photoRef = ref(storage, avatarPath);
      
      // Use uploadBytesResumable for better progress tracking and reliability
      const uploadTask = uploadBytesResumable(photoRef, file, {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      });
      
      // Wait for upload to complete
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('[Profile] Upload progress:', Math.round(progress) + '%');
          },
          (error) => {
            console.error('[Profile] Upload error:', error);
            reject(error);
          },
          () => {
            console.log('[Profile] Photo uploaded successfully');
            resolve();
          }
        );
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      console.log('[Profile] Got download URL:', downloadURL);

      // Update Firebase Auth profile
      console.log('[Profile] Updating Firebase Auth profile...');
      await updateProfile(currentUser, { photoURL: downloadURL });
      console.log('[Profile] Firebase Auth profile updated');
      
      // Reload user to get updated photoURL
      await reload(currentUser);

      // Update Firestore profile
      console.log('[Profile] Updating Firestore profile...');
      const profileRef = doc(db, 'profiles', currentUser.uid);
      await setDoc(profileRef, { photoURL: downloadURL }, { merge: true });
      console.log('[Profile] Firestore profile updated');

      // Update local state immediately
      setPhotoURL(downloadURL);
      
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('[Profile] Error uploading photo:', error);
      // ... error handling ...
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    */
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      // Update Firebase Auth profile
      if (formData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: formData.displayName });
      }

      // Update Firestore profile
      const profileRef = doc(db, 'profiles', currentUser.uid);
      await setDoc(profileRef, {
        github: formData.github,
        linkedin: formData.linkedin,
        website: formData.website,
        role: formData.role,
        organization: formData.organization,
        resumeUrl: formData.resumeUrl,
        bio: formData.bio,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setEditing(false);
      setOriginalData(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (originalData) {
      setFormData(originalData);
    } else if (currentUser) {
      setFormData(prev => ({
        ...prev,
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
      }));
    }
  };

  const statCards = [
    {
      label: 'Total Scans',
      value: stats.totalScans,
      caption: 'Synced + queued operations',
    },
    {
      label: 'Reports Saved',
      value: stats.reportsSaved,
      caption: 'In secure Firestore vault',
    },
    {
      label: 'Queued for Sync',
      value: stats.queued,
      caption: 'Will flush when online',
    },
  ];

  if (!currentUser) {
    return (
      <PageWrapper>
        <div className="text-center p-10 text-slate-400">
          Please log in to view your profile.
        </div>
      </PageWrapper>
    );
  }

  return (
    <>
      <SEO
        title="Profile"
        description="Manage your cyber-operator identity, update social links, and monitor secure scan stats."
      />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#050b1f]/80 p-6 sm:p-10 shadow-[0_35px_120px_rgba(5,8,22,0.9)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Operator Profile</p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white">Identity & Preferences</h1>
              <p className="mt-2 text-slate-400 max-w-2xl">
                Personalize your neon console, update mission roles, and keep social intel fresh for team handoffs.
              </p>
            </div>
            <div className="flex gap-3">
              {editing ? (
                <button
                  onClick={handleCancelEdit}
                  className="rounded-full border border-red-400/40 px-5 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 transition"
                >
                  Exit Editing
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-2 text-sm font-semibold shadow-[0_0_25px_rgba(0,255,255,0.3)]"
                >
                  <span className="flex items-center gap-2">
                    <Edit2 size={16} />
                    Edit Profile
                  </span>
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative z-10 mt-6 grid gap-4 sm:grid-cols-3"
          >
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20"
              >
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mt-2">{card.label}</p>
                <p className="text-xs text-slate-400 mt-1">{card.caption}</p>
              </div>
            ))}
          </motion.div>

          <div className="relative z-10 mt-10 grid gap-8 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-cyan-400/20 bg-[#050c23]/90 p-6 shadow-[0_0_45px_rgba(0,255,255,0.12)]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-28 h-28 rounded-full border-4 border-white/15 overflow-hidden shadow-lg relative">
                    {photoURL && (
                      <img 
                        src={photoURL} 
                        alt={formData.displayName || 'Profile'} 
                        className="h-full w-full object-cover z-30 relative"
                        onError={(e) => {
                          console.warn('[Profile] Avatar image failed to load:', photoURL);
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                          if (fallback) {
                            fallback.style.display = 'flex';
                            fallback.classList.remove('hidden');
                          }
                        }}
                      />
                    )}
                    <div 
                      className={`avatar-fallback h-full w-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center z-30 relative ${photoURL ? 'hidden' : 'flex'}`}
                    >
                      <User size={42} className="text-white" />
                    </div>
                  </div>
                  {/* DISABLED: Upload button completely removed - avatar changes are admin-managed only */}
                  {/* To re-enable: Set REACT_APP_ALLOW_AVATAR_UPLOAD=true in .env and uncomment below */}
                  {/* 
                  {process.env.REACT_APP_ALLOW_AVATAR_UPLOAD === 'true' && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-1 right-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 p-2 shadow-lg disabled:opacity-60"
                        aria-label="Upload profile picture"
                      >
                        {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={16} className="text-white" />}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </>
                  )}
                  */}
                </div>
                {/* Info message about disabled uploads */}
                {process.env.REACT_APP_ALLOW_AVATAR_UPLOAD !== 'true' && (
                  <p className="mt-2 text-xs text-slate-500 italic">
                    Avatar changes are disabled. Contact an administrator to update avatar.
                  </p>
                )}
                <h2 className="text-xl font-semibold text-white">{formData.displayName || 'Unnamed Operator'}</h2>
                <p className="text-sm text-slate-400">{formData.email}</p>
                {formData.bio && <p className="mt-4 text-slate-300 text-sm">{formData.bio}</p>}
                {/* Dev-only debug button for avatar check */}
                {process.env.NODE_ENV !== 'production' && (
                  <button
                    onClick={async () => {
                      console.log('[RemovePFP] Avatar check:', {
                        photoURL: currentUser?.photoURL,
                        profilePhotoURL: photoURL,
                        displayName: currentUser?.displayName
                      });
                      if (photoURL) {
                        try {
                          const response = await fetch(photoURL, { method: 'HEAD' });
                          console.log('[RemovePFP] Avatar fetch status:', response.status, response.ok ? 'OK' : 'FAILED');
                          if (!response.ok) {
                            console.warn('[RemovePFP] Avatar URL returns', response.status);
                          }
                        } catch (err) {
                          console.error('[RemovePFP] Avatar fetch error:', err);
                        }
                      }
                    }}
                    className="mt-2 text-xs text-cyan-300 hover:text-cyan-200 underline"
                  >
                    [DEV] Check Avatar
                  </button>
                )}
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-cyan-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Role</p>
                    <p>{formData.role || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 size={16} className="text-cyan-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Organization</p>
                    <p>{formData.organization || 'Independent Operator'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-white/5 pt-4">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-3">Links</p>
                <div className="space-y-2 text-sm text-slate-300">
                  {[
                    { icon: Github, label: 'GitHub', value: formData.github },
                    { icon: Linkedin, label: 'LinkedIn', value: formData.linkedin },
                    { icon: Link2, label: 'Website', value: formData.website },
                    { icon: FileText, label: 'Resume', value: formData.resumeUrl },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon size={16} className="text-cyan-300" />
                      {value ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-cyan-200 hover:text-white"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="text-slate-500">No {label.toLowerCase()} linked</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <form onSubmit={handleUpdate} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    Display Name
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      disabled={!editing}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    />
                  </label>
                  <label className="text-sm text-slate-300 flex flex-col">
                    <span>Email</span>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-slate-500 cursor-not-allowed"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Briefcase size={16} />
                      Role
                    </span>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      disabled={!editing}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Building2 size={16} />
                      Organization
                    </span>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      disabled={!editing}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    />
                  </label>
                </div>

                <label className="text-sm text-slate-300">
                  Bio
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!editing}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    placeholder="Threat intel, interests, or mission statement."
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Github size={16} />
                      GitHub URL
                    </span>
                    <input
                      type="url"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      disabled={!editing}
                      placeholder="https://github.com/username"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Linkedin size={16} />
                      LinkedIn URL
                    </span>
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      disabled={!editing}
                      placeholder="https://linkedin.com/in/username"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Link2 size={16} />
                      Website
                    </span>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      disabled={!editing}
                      placeholder="https://portfolio.com"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <FileText size={16} />
                      Resume URL
                    </span>
                    <input
                      type="url"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                      disabled={!editing}
                      placeholder="https://example.com/resume.pdf"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    />
                  </label>
                </div>

                {editing && (
                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 text-sm font-semibold shadow-[0_0_35px_rgba(0,255,255,0.25)] disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Save size={16} />
                          Save Changes
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </section>
        </div>
      </PageWrapper>
    </>
  );
}
