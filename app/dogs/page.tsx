'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, Camera, Plus, CheckCircle, Trash2, Pencil, X, Upload, Shield, ShieldCheck, ShieldAlert, Clock, Phone, MapPin, Stethoscope, AlertTriangle } from 'lucide-react'

const BREEDS = ['Affenpinscher','Afghan Hound','Airedale Terrier','Akita','Alaskan Malamute','American Bulldog','American Eskimo Dog','American Foxhound','American Pit Bull Terrier','American Staffordshire Terrier','Australian Cattle Dog','Australian Shepherd','Australian Terrier','Basenji','Basset Hound','Beagle','Bearded Collie','Bedlington Terrier','Belgian Malinois','Belgian Sheepdog','Belgian Tervuren','Bernese Mountain Dog','Bichon Frise','Black and Tan Coonhound','Bloodhound','Border Collie','Border Terrier','Borzoi','Boston Terrier','Bouvier des Flandres','Boxer','Boykin Spaniel','Briard','Brittany','Brussels Griffon','Bull Terrier','Bulldog','Bullmastiff','Cairn Terrier','Cane Corso','Cavalier King Charles Spaniel','Chesapeake Bay Retriever','Chihuahua','Chinese Crested','Chinese Shar-Pei','Chow Chow','Cocker Spaniel','Collie','Dachshund','Dalmatian','Doberman Pinscher','Dogue de Bordeaux','English Setter','English Springer Spaniel','Flat-Coated Retriever','French Bulldog','German Pinscher','German Shepherd','German Shorthaired Pointer','German Wirehaired Pointer','Giant Schnauzer','Golden Retriever','Gordon Setter','Great Dane','Great Pyrenees','Greater Swiss Mountain Dog','Greyhound','Havanese','Ibizan Hound','Irish Setter','Irish Terrier','Irish Water Spaniel','Irish Wolfhound','Italian Greyhound','Jack Russell Terrier','Japanese Chin','Keeshond','Kerry Blue Terrier','Komondor','Kuvasz','Labrador Retriever','Lhasa Apso','Maltese','Mastiff','Miniature Pinscher','Miniature Schnauzer','Newfoundland','Norfolk Terrier','Norwegian Elkhound','Norwich Terrier','Old English Sheepdog','Papillon','Pekingese','Pembroke Welsh Corgi','Pointer','Pomeranian','Poodle (Miniature)','Poodle (Standard)','Poodle (Toy)','Portuguese Water Dog','Pug','Rat Terrier','Redbone Coonhound','Rhodesian Ridgeback','Rottweiler','Saint Bernard','Samoyed','Schipperke','Scottish Deerhound','Scottish Terrier','Shetland Sheepdog','Shiba Inu','Shih Tzu','Siberian Husky','Silky Terrier','Soft Coated Wheaten Terrier','Staffordshire Bull Terrier','Standard Schnauzer','Sussex Spaniel','Tibetan Mastiff','Tibetan Terrier','Vizsla','Weimaraner','Welsh Springer Spaniel','Welsh Terrier','West Highland White Terrier','Whippet','Wire Fox Terrier','Wirehaired Pointing Griffon','Xoloitzcuintli','Yorkshire Terrier','Mixed Breed','Other']

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const, color: '#1a1a2e', outline: 'none', fontFamily: 'inherit' }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }

export default function MyDogs() {
  const [dogs, setDogs] = useState<any[]>([])
  const [ownerId, setOwnerId] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerCity, setOwnerCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingDog, setEditingDog] = useState<any>(null)
  const [addingDog, setAddingDog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDog, setNewDog] = useState({ name: '', breed: '', weight: '', birthday: '', visibility: 'anonymous' })
  const [uploadingVaccine, setUploadingVaccine] = useState<string | null>(null)
  const [vaccineFiles, setVaccineFiles] = useState<Record<string, File>>({})
  const [vaccinePreviews, setVaccinePreviews] = useState<Record<string, string>>({})
  const [vaccineSuccess, setVaccineSuccess] = useState<string | null>(null)
  const [vaccines, setVaccines] = useState<Record<string, any>>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setOwnerEmail(user.email || '')
      const { data: ownerData } = await supabase.from('owners').select('id, city, name').eq('email', user.email).single()
      if (ownerData) {
        setOwnerId(ownerData.id)
        setOwnerCity(ownerData.city || '')
        setOwnerName(ownerData.name || '')
        fetchDogs(ownerData.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  const fetchDogs = async (ownerId: string) => {
    const { data } = await supabase.from('dogs').select('*, leaderboard_settings(city, visibility, display_name)').eq('owner_id', ownerId).order('name')
    setDogs(data || [])
    if (data && data.length > 0) {
      const dogIds = data.map((d: any) => d.id)
      const { data: vaccineData } = await supabase.from('dog_vaccines').select('*').in('dog_id', dogIds).order('uploaded_at', { ascending: false })
      if (vaccineData) {
        const vaccineMap: Record<string, any> = {}
        for (const v of vaccineData) { if (!vaccineMap[v.dog_id]) vaccineMap[v.dog_id] = v }
        setVaccines(vaccineMap)
      }
    }
  }

  const handleEdit = (dog: any) => { setEditingDog({ ...dog }); setAddingDog(false); setSuccess(false); setError(null) }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingDog) return
    setUploadingPhoto(true)
    const fileName = `${editingDog.id}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('dog-photos').upload(fileName, file, { upsert: true })
    if (uploadError) { setError('Photo upload failed: ' + uploadError.message); setUploadingPhoto(false); return }
    const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(fileName)
    setEditingDog({ ...editingDog, photo_url: urlData.publicUrl })
    setUploadingPhoto(false)
  }

  const handleNewDogPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewPhotoFile(file)
    setNewPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null)
    const { error: updateError } = await supabase.from('dogs').update({
      name: editingDog.name, breed: editingDog.breed, weight: editingDog.weight,
      birthday: editingDog.birthday || null, photo_url: editingDog.photo_url,
      vet_name: editingDog.vet_name || null, vet_clinic: editingDog.vet_clinic || null, vet_phone: editingDog.vet_phone || null,
    }).eq('id', editingDog.id)
    if (updateError) { setError(updateError.message); setSaving(false); return }
    if (editingDog.leaderboard_settings) {
      await supabase.from('leaderboard_settings').update({
        city: editingDog.leaderboard_settings.city || ownerCity,
        visibility: editingDog.leaderboard_settings.visibility,
        display_name: editingDog.leaderboard_settings.display_name || editingDog.name,
      }).eq('dog_id', editingDog.id)
    }
    setSuccess(true); setSaving(false); setEditingDog(null)
    fetchDogs(ownerId); setTimeout(() => setSuccess(false), 3000)
  }

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null)
    const { data: dogData, error: dogError } = await supabase.from('dogs').insert([{
      owner_id: ownerId, name: newDog.name, breed: newDog.breed,
      weight: newDog.weight || null, birthday: newDog.birthday || null,
    }]).select().single()
    if (dogError || !dogData) { setError(dogError?.message || 'Failed to add dog'); setSaving(false); return }
    if (newPhotoFile) {
      const fileName = `${dogData.id}.${newPhotoFile.name.split('.').pop()}`
      await supabase.storage.from('dog-photos').upload(fileName, newPhotoFile, { upsert: true })
      const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(fileName)
      await supabase.from('dogs').update({ photo_url: urlData.publicUrl }).eq('id', dogData.id)
    }
    await supabase.from('leaderboard_settings').insert([{ dog_id: dogData.id, city: ownerCity, visibility: newDog.visibility, display_name: newDog.name }])
    setSuccess(true); setSaving(false); setAddingDog(false)
    setNewDog({ name: '', breed: '', weight: '', birthday: '', visibility: 'anonymous' })
    setNewPhotoFile(null); setNewPhotoPreview(null)
    fetchDogs(ownerId); setTimeout(() => setSuccess(false), 3000)
  }

  const handleDelete = async (dogId: string, dogName: string) => {
    if (!confirm(`Are you sure you want to remove ${dogName}? This cannot be undone.`)) return
    await supabase.from('dogs').delete().eq('id', dogId)
    fetchDogs(ownerId)
  }

  const handleVaccineUpload = async (dogId: string, dogName: string) => {
    const vaccineFile = vaccineFiles[dogId]
    if (!vaccineFile) return
    setUploadingVaccine(dogId)
    const fileName = `vaccines/${dogId}-${Date.now()}.${vaccineFile.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('dog-photos').upload(fileName, vaccineFile, { upsert: true })
    if (uploadError) { setError('Upload failed: ' + uploadError.message); setUploadingVaccine(null); return }
    const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(fileName)
    await supabase.from('dog_vaccines').delete().eq('dog_id', dogId)
    const { error: insertError } = await supabase.from('dog_vaccines').insert([{ dog_id: dogId, photo_url: urlData.publicUrl, status: 'pending' }])
    if (insertError) { setError(insertError.message); setUploadingVaccine(null); return }
    await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vaccine_uploaded', to: 'dev@thecaninegym.com', data: { dogName, ownerName, ownerEmail, photoUrl: urlData.publicUrl, dogId } })
    })
    setVaccineSuccess(dogId)
    setVaccineFiles(prev => { const n = { ...prev }; delete n[dogId]; return n })
    setVaccinePreviews(prev => { const n = { ...prev }; delete n[dogId]; return n })
    setUploadingVaccine(null); fetchDogs(ownerId); setTimeout(() => setVaccineSuccess(null), 4000)
  }

  const getVaccineBadge = (dogId: string) => {
    const v = vaccines[dogId]
    if (!v) return { color: '#dc3545', bg: '#ffeaea', border: '#ffc5c5', icon: <ShieldAlert size={13} />, label: 'Vaccines Required' }
    if (v.status === 'approved') return { color: '#155724', bg: '#d4edda', border: '#b8dfc4', icon: <ShieldCheck size={13} />, label: 'Vaccines Approved' }
    if (v.status === 'pending') return { color: '#856404', bg: '#fff3cd', border: '#ffe08a', icon: <Clock size={13} />, label: 'Under Review' }
    if (v.status === 'rejected') return { color: '#dc3545', bg: '#ffeaea', border: '#ffc5c5', icon: <ShieldAlert size={13} />, label: 'Rejected — Re-upload' }
    return { color: '#dc3545', bg: '#ffeaea', border: '#ffc5c5', icon: <ShieldAlert size={13} />, label: 'Vaccines Required' }
  }

  const getExpiryWarnings = (dogId: string) => {
    const v = vaccines[dogId]
    if (!v || v.status !== 'approved') return []
    const warnings: string[] = []
    const today = new Date(); const soon = new Date(); soon.setDate(today.getDate() + 30)
    const fields = [
      { key: 'rabies_exp', label: 'Rabies' }, { key: 'dhpp_exp', label: 'DHPP' },
      { key: 'bordetella_exp', label: 'Bordetella' }, { key: 'leptospira_exp', label: 'Leptospira' },
      { key: 'influenza_exp', label: 'Influenza' },
    ]
    for (const f of fields) {
      if (v[f.key]) {
        const exp = new Date(v[f.key])
        if (exp < today) warnings.push(`${f.label} has expired`)
        else if (exp <= soon) warnings.push(`${f.label} expires soon (${exp.toLocaleDateString()})`)
      }
    }
    return warnings
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001a4d 0%, #003087 100%)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .dog-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.1) !important; }
        input:focus, select:focus { border-color: #003087 !important; box-shadow: 0 0 0 3px rgba(0,48,135,0.08); }
        * { box-sizing: border-box; }
        @media (max-width: 480px) {
  .dog-header { flex-direction: column; gap: 12px; }
  .dog-actions { width: 100%; }
  .dog-actions button { flex: 1; justify-content: center; }
}
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'linear-gradient(135deg, #001a4d 0%, #003087 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,107,53,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PawPrint size={20} color="#FF6B35" />
          </div>
          <span style={{ color: 'white', fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>The Canine Gym</span>
        </div>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '780px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>My Dogs</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>{dogs.length} dog{dogs.length !== 1 ? 's' : ''} registered</p>
          </div>
          {!addingDog && (
            <button onClick={() => { setAddingDog(true); setEditingDog(null); setSuccess(false); setError(null) }}
              style={{ background: 'linear-gradient(135deg, #FF6B35, #ff8c5a)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '14px', boxShadow: '0 4px 14px rgba(255,107,53,0.35)' }}>
              <Plus size={16} /> Add Dog
            </button>
          )}
        </div>

        {/* Alerts */}
        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '13px 18px', borderRadius: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}>
            <CheckCircle size={17} /> Saved successfully!
          </div>
        )}
        {error && (
          <div style={{ background: '#ffeaea', color: '#dc3545', padding: '13px 18px', borderRadius: '12px', marginBottom: '18px', fontSize: '14px', fontWeight: '600' }}>{error}</div>
        )}

        {/* Add Dog Form */}
        {addingDog && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #e5e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: '#1a1a2e', margin: '0 0 3px', fontWeight: '800', fontSize: '17px' }}>Add New Dog</h3>
                <p style={{ color: '#aaa', margin: 0, fontSize: '13px' }}>Fill in your dog's details below</p>
              </div>
              <button onClick={() => { setAddingDog(false); setNewDog({ name: '', breed: '', weight: '', birthday: '', visibility: 'anonymous' }); setNewPhotoPreview(null) }}
                style={{ background: '#f0f2f7', border: 'none', cursor: 'pointer', color: '#666', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddDog}>
              {/* Photo Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '20px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', overflow: 'hidden', border: '2px solid #e5e8f0' }}>
                  {newPhotoPreview ? <img src={newPhotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PawPrint size={36} color="#ccc" />}
                </div>
                <label style={{ cursor: 'pointer', color: '#003087', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px', background: '#e8edf5', padding: '6px 14px', borderRadius: '20px' }}>
                  <Camera size={13} /> Add Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleNewDogPhoto} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Dog's Name *</label>
                  <input required value={newDog.name} onChange={e => setNewDog({ ...newDog, name: e.target.value })} style={inputStyle} placeholder="e.g. Gravy" />
                </div>
                <div>
                  <label style={labelStyle}>Breed</label>
                  <select value={newDog.breed} onChange={e => setNewDog({ ...newDog, breed: e.target.value })} style={inputStyle}>
                    <option value="">Select breed</option>
                    {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Weight (lbs)</label>
                  <input type="number" value={newDog.weight} onChange={e => setNewDog({ ...newDog, weight: e.target.value })} style={inputStyle} placeholder="e.g. 45" />
                </div>
                <div>
                  <label style={labelStyle}>Birthday</label>
                  <input type="date" value={newDog.birthday} onChange={e => setNewDog({ ...newDog, birthday: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Leaderboard Visibility</label>
                <select value={newDog.visibility} onChange={e => setNewDog({ ...newDog, visibility: e.target.value })} style={inputStyle}>
                  <option value="public">Public (show name)</option>
                  <option value="anonymous">Anonymous (hide name)</option>
                  <option value="private">Private (not on leaderboard)</option>
                </select>
              </div>

              <div style={{ background: '#fff8e6', border: '1.5px solid #ffe08a', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Shield size={17} color="#856404" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ margin: 0, color: '#856404', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Vaccines required before booking.</strong> After adding your dog, upload a photo of their vaccine records. We'll review and approve within 24 hours.
                </p>
              </div>

              <button type="submit" disabled={saving}
                style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #003087, #0052cc)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,48,135,0.25)' }}>
                {saving ? 'Adding…' : 'Add Dog'}
              </button>
            </form>
          </div>
        )}

        {/* Empty State */}
        {dogs.length === 0 && !addingDog && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '52px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <PawPrint size={48} color="#dde0ea" style={{ marginBottom: '14px' }} />
            <p style={{ color: '#bbb', marginBottom: '20px', fontSize: '15px' }}>No dogs added yet.</p>
            <button onClick={() => setAddingDog(true)}
              style={{ background: 'linear-gradient(135deg, #FF6B35, #ff8c5a)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>
              Add Your First Dog
            </button>
          </div>
        )}

        {/* Dog Cards */}
        {dogs.map((dog: any) => {
          const badge = getVaccineBadge(dog.id)
          const expiryWarnings = getExpiryWarnings(dog.id)
          const vaccine = vaccines[dog.id]
          const isEditing = editingDog?.id === dog.id

          return (
            <div key={dog.id} className="dog-card" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s', border: '1.5px solid #eef0f5' }}>

              {/* Dog Header */}
              <div className="dog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isEditing ? '24px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.name} style={{ width: '72px', height: '72px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, border: '2px solid #eef0f5' }} />
                  ) : (
                    <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PawPrint size={30} color="#ccc" />
                    </div>
                  )}
                  <div>
                    <h3 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '19px', fontWeight: '800' }}>{dog.name}</h3>
                    <p style={{ color: '#888', margin: '0 0 8px', fontSize: '13px' }}>
                      {dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''}
                      {dog.birthday ? ` · Born ${new Date(dog.birthday).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: badge.bg, color: badge.color, border: `1.5px solid ${badge.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                      {badge.icon} {badge.label}
                    </div>
                  </div>
                </div>
                {!isEditing && (
                  <div className="dog-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => handleEdit(dog)}
                      style={{ background: '#f0f2f7', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '700', color: '#555' }}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => handleDelete(dog.id, dog.name)}
                      style={{ background: '#ffeaea', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '700' }}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Expiry Warnings */}
              {expiryWarnings.length > 0 && !isEditing && (
                <div style={{ marginTop: '14px', background: '#fff8e6', border: '1.5px solid #ffe08a', borderRadius: '10px', padding: '10px 14px' }}>
                  {expiryWarnings.map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#856404', fontSize: '13px', fontWeight: '600', marginBottom: i < expiryWarnings.length - 1 ? '5px' : 0 }}>
                      <AlertTriangle size={13} /> {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Form */}
              {isEditing && (
                <form onSubmit={handleSave}>
                  {/* Photo */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '22px' }}>
                    <div style={{ width: '88px', height: '88px', borderRadius: '18px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', overflow: 'hidden', border: '2px solid #e5e8f0' }}>
                      {editingDog.photo_url ? <img src={editingDog.photo_url} alt={editingDog.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PawPrint size={32} color="#ccc" />}
                    </div>
                    <label style={{ cursor: 'pointer', color: '#003087', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px', background: '#e8edf5', padding: '6px 14px', borderRadius: '20px' }}>
                      <Camera size={13} /> {uploadingPhoto ? 'Uploading…' : 'Change Photo'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={labelStyle}>Dog's Name</label>
                      <input value={editingDog.name} onChange={e => setEditingDog({ ...editingDog, name: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Breed</label>
                      <select value={editingDog.breed} onChange={e => setEditingDog({ ...editingDog, breed: e.target.value })} style={inputStyle}>
                        {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Weight (lbs)</label>
                      <input type="number" value={editingDog.weight || ''} onChange={e => setEditingDog({ ...editingDog, weight: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Birthday</label>
                      <input type="date" value={editingDog.birthday?.split('T')[0] || ''} onChange={e => setEditingDog({ ...editingDog, birthday: e.target.value })} style={inputStyle} />
                    </div>
                  </div>

                  {/* Vet Info */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Vet Clinic Name</label>
                    <input value={editingDog.vet_clinic || ''} onChange={e => setEditingDog({ ...editingDog, vet_clinic: e.target.value })} placeholder="Carmel Animal Hospital" style={inputStyle} />
                  </div>

                  {editingDog.leaderboard_settings && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>Leaderboard Visibility</label>
                      <select value={editingDog.leaderboard_settings.visibility} onChange={e => setEditingDog({ ...editingDog, leaderboard_settings: { ...editingDog.leaderboard_settings, visibility: e.target.value } })} style={inputStyle}>
                        <option value="public">Public (show name)</option>
                        <option value="anonymous">Anonymous (hide name)</option>
                        <option value="private">Private (not on leaderboard)</option>
                      </select>
                    </div>
                  )}

                  {error && <p style={{ color: '#dc3545', marginBottom: '12px', fontSize: '13px', fontWeight: '600' }}>{error}</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={saving}
                      style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #003087, #0052cc)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 14px rgba(0,48,135,0.2)' }}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setEditingDog(null)}
                      style={{ padding: '12px 20px', background: '#f0f2f7', color: '#555', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Vaccine Section */}
              {!isEditing && (
                <div style={{ marginTop: '18px', borderTop: '1.5px solid #f0f2f7', paddingTop: '18px' }}>
                  <div style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '13px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <div style={{ width: '26px', height: '26px', background: '#e8edf5', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Shield size={14} color="#003087" />
  </div>
  Vaccine Records
</div>

                  {vaccine?.status === 'approved' && (
                    <div style={{ marginBottom: '14px', background: '#f0f9f4', border: '1.5px solid #b8dfc4', borderRadius: '12px', padding: '14px 16px' }}>
                      <p style={{ color: '#155724', fontWeight: '700', fontSize: '13px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={14} /> Approved on {new Date(vaccine.reviewed_at).toLocaleDateString()}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {[{ key: 'rabies_exp', label: 'Rabies' }, { key: 'dhpp_exp', label: 'DHPP' }, { key: 'bordetella_exp', label: 'Bordetella' }, { key: 'leptospira_exp', label: 'Leptospira' }, { key: 'influenza_exp', label: 'Influenza' }]
                          .map(f => vaccine[f.key] ? (
                            <span key={f.key} style={{ background: 'white', border: '1.5px solid #b8dfc4', borderRadius: '8px', padding: '3px 10px', fontSize: '12px', color: '#155724', fontWeight: '600' }}>
                              {f.label}: {new Date(vaccine[f.key]).toLocaleDateString()}
                            </span>
                          ) : null)}
                      </div>
                      {vaccine.other_vaccines && <p style={{ color: '#555', fontSize: '13px', margin: '8px 0 0' }}>Other: {vaccine.other_vaccines}</p>}
                    </div>
                  )}

                  {vaccine?.status === 'rejected' && vaccine.admin_notes && (
                    <div style={{ marginBottom: '14px', background: '#ffeaea', border: '1.5px solid #ffc5c5', borderRadius: '12px', padding: '12px 16px' }}>
                      <p style={{ color: '#dc3545', fontSize: '13px', margin: 0, fontWeight: '600' }}><strong>Rejection note:</strong> {vaccine.admin_notes}</p>
                    </div>
                  )}

                  {vaccine?.status === 'pending' && (
                    <div style={{ marginBottom: '14px', background: '#fff8e6', border: '1.5px solid #ffe08a', borderRadius: '12px', padding: '12px 16px' }}>
                      <p style={{ color: '#856404', fontSize: '13px', margin: 0, fontWeight: '600' }}>
                        <Clock size={13} style={{ display: 'inline', marginRight: '5px' }} />
                        Submitted {new Date(vaccine.uploaded_at).toLocaleDateString()} — we'll review within 24 hours.
                      </p>
                    </div>
                  )}

                  {(!vaccine || vaccine.status === 'rejected') && (
                    vaccineSuccess === dog.id ? (
                      <div style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                        <CheckCircle size={16} /> Uploaded! We'll review within 24 hours.
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: '#888', fontSize: '13px', margin: '0 0 12px' }}>Upload a photo of your dog's vaccine record. Required before booking.</p>
                        {vaccinePreviews[dog.id] ? (
                          <div style={{ marginBottom: '12px' }}>
                            {vaccineFiles[dog.id]?.type === 'application/pdf' ? (
                              <div style={{ width: '220px', height: '110px', border: '2px solid #003087', borderRadius: '12px', background: '#f0f4ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div style={{ fontSize: '28px' }}>📄</div>
                                <span style={{ color: '#003087', fontWeight: '700', fontSize: '13px' }}>PDF Selected</span>
                              </div>
                            ) : (
                              <img src={vaccinePreviews[dog.id]} alt="preview" style={{ width: '220px', height: '150px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #003087', display: 'block' }} />
                            )}
                            <p style={{ color: '#888', fontSize: '12px', margin: '6px 0 0' }}>{vaccineFiles[dog.id]?.name}</p>
                          </div>
                        ) : (
                          <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '220px', height: '130px', border: '2px dashed #d0d8ee', borderRadius: '12px', background: '#f8f9ff', marginBottom: '12px', gap: '8px' }}>
                            <Upload size={26} color="#aab" />
                            <span style={{ color: '#888', fontSize: '13px', fontWeight: '600' }}>Click to choose file</span>
                            <span style={{ color: '#bbb', fontSize: '11px' }}>JPG, PNG or PDF</span>
                            <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) { setVaccineFiles(prev => ({ ...prev, [dog.id]: f })); setVaccinePreviews(prev => ({ ...prev, [dog.id]: URL.createObjectURL(f) })) } }} />
                          </label>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {vaccinePreviews[dog.id] && (
                            <label style={{ cursor: 'pointer', background: '#f0f2f7', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Upload size={13} /> Change
                              <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) { setVaccineFiles(prev => ({ ...prev, [dog.id]: f })); setVaccinePreviews(prev => ({ ...prev, [dog.id]: URL.createObjectURL(f) })) } }} />
                            </label>
                          )}
                          {vaccineFiles[dog.id] && (
                            <button onClick={() => handleVaccineUpload(dog.id, dog.name)} disabled={uploadingVaccine === dog.id}
                              style={{ background: 'linear-gradient(135deg, #003087, #0052cc)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {uploadingVaccine === dog.id ? 'Uploading…' : <><Shield size={13} /> Submit Vaccines</>}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {vaccine?.status === 'approved' && (
                    <div style={{ marginTop: '12px' }}>
                      {vaccineSuccess === dog.id ? (
                        <div style={{ background: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                          <CheckCircle size={15} /> New records submitted for review.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <label style={{ cursor: 'pointer', background: '#f0f2f7', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', color: '#555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Upload size={12} /> Update Vaccine Records
                            <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) { setVaccineFiles(prev => ({ ...prev, [dog.id]: f })); setVaccinePreviews(prev => ({ ...prev, [dog.id]: URL.createObjectURL(f) })) } }} />
                          </label>
                          {vaccineFiles[dog.id] && (
                            <button onClick={() => handleVaccineUpload(dog.id, dog.name)} disabled={uploadingVaccine === dog.id}
                              style={{ background: 'linear-gradient(135deg, #003087, #0052cc)', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                              {uploadingVaccine === dog.id ? 'Uploading…' : 'Submit'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vet Info Display */}
                  {dog.vet_clinic && (
                    <div style={{ marginTop: '14px', borderTop: '1.5px solid #f0f2f7', paddingTop: '12px' }}>
                      <span style={{ color: '#666', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0f2f7', padding: '4px 10px', borderRadius: '8px' }}>
                        <MapPin size={12} color="#003087" /> {dog.vet_clinic}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}