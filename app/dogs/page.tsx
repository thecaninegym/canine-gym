'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, Camera, Plus, CheckCircle, Trash2, Pencil, X, Upload, Shield, ShieldCheck, ShieldAlert, Clock, Phone, MapPin, Stethoscope, AlertTriangle } from 'lucide-react'

const BREEDS = ['Affenpinscher','Afghan Hound','Airedale Terrier','Akita','Alaskan Malamute','American Bulldog','American Eskimo Dog','American Foxhound','American Pit Bull Terrier','American Staffordshire Terrier','Australian Cattle Dog','Australian Shepherd','Australian Terrier','Basenji','Basset Hound','Beagle','Bearded Collie','Bedlington Terrier','Belgian Malinois','Belgian Sheepdog','Belgian Tervuren','Bernese Mountain Dog','Bichon Frise','Black and Tan Coonhound','Bloodhound','Border Collie','Border Terrier','Borzoi','Boston Terrier','Bouvier des Flandres','Boxer','Boykin Spaniel','Briard','Brittany','Brussels Griffon','Bull Terrier','Bulldog','Bullmastiff','Cairn Terrier','Cane Corso','Cavalier King Charles Spaniel','Chesapeake Bay Retriever','Chihuahua','Chinese Crested','Chinese Shar-Pei','Chow Chow','Cocker Spaniel','Collie','Dachshund','Dalmatian','Doberman Pinscher','Dogue de Bordeaux','English Setter','English Springer Spaniel','Flat-Coated Retriever','French Bulldog','German Pinscher','German Shepherd','German Shorthaired Pointer','German Wirehaired Pointer','Giant Schnauzer','Golden Retriever','Gordon Setter','Great Dane','Great Pyrenees','Greater Swiss Mountain Dog','Greyhound','Havanese','Ibizan Hound','Irish Setter','Irish Terrier','Irish Water Spaniel','Irish Wolfhound','Italian Greyhound','Jack Russell Terrier','Japanese Chin','Keeshond','Kerry Blue Terrier','Komondor','Kuvasz','Labrador Retriever','Lhasa Apso','Maltese','Mastiff','Miniature Pinscher','Miniature Schnauzer','Newfoundland','Norfolk Terrier','Norwegian Elkhound','Norwich Terrier','Old English Sheepdog','Papillon','Pekingese','Pembroke Welsh Corgi','Pointer','Pomeranian','Poodle (Miniature)','Poodle (Standard)','Poodle (Toy)','Portuguese Water Dog','Pug','Rat Terrier','Redbone Coonhound','Rhodesian Ridgeback','Rottweiler','Saint Bernard','Samoyed','Schipperke','Scottish Deerhound','Scottish Terrier','Shetland Sheepdog','Shiba Inu','Shih Tzu','Siberian Husky','Silky Terrier','Soft Coated Wheaten Terrier','Staffordshire Bull Terrier','Standard Schnauzer','Sussex Spaniel','Tibetan Mastiff','Tibetan Terrier','Vizsla','Weimaraner','Welsh Springer Spaniel','Welsh Terrier','West Highland White Terrier','Whippet','Wire Fox Terrier','Wirehaired Pointing Griffon','Xoloitzcuintli','Yorkshire Terrier','Mixed Breed','Other']

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
        for (const v of vaccineData) {
          if (!vaccineMap[v.dog_id]) vaccineMap[v.dog_id] = v
        }
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
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error: updateError } = await supabase.from('dogs').update({
      name: editingDog.name,
      breed: editingDog.breed,
      weight: editingDog.weight,
      birthday: editingDog.birthday || null,
      photo_url: editingDog.photo_url,
      vet_name: editingDog.vet_name || null,
      vet_clinic: editingDog.vet_clinic || null,
      vet_phone: editingDog.vet_phone || null,
    }).eq('id', editingDog.id)
    if (updateError) { setError(updateError.message); setSaving(false); return }
    if (editingDog.leaderboard_settings) {
      await supabase.from('leaderboard_settings').update({
        city: editingDog.leaderboard_settings.city || ownerCity,
        visibility: editingDog.leaderboard_settings.visibility,
        display_name: editingDog.leaderboard_settings.display_name || editingDog.name,
      }).eq('dog_id', editingDog.id)
    }
    setSuccess(true)
    setSaving(false)
    setEditingDog(null)
    fetchDogs(ownerId)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data: dogData, error: dogError } = await supabase.from('dogs').insert([{
      owner_id: ownerId,
      name: newDog.name,
      breed: newDog.breed,
      weight: newDog.weight || null,
      birthday: newDog.birthday || null,
    }]).select().single()
    if (dogError || !dogData) { setError(dogError?.message || 'Failed to add dog'); setSaving(false); return }
    if (newPhotoFile) {
      const fileName = `${dogData.id}.${newPhotoFile.name.split('.').pop()}`
      await supabase.storage.from('dog-photos').upload(fileName, newPhotoFile, { upsert: true })
      const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(fileName)
      await supabase.from('dogs').update({ photo_url: urlData.publicUrl }).eq('id', dogData.id)
    }
    await supabase.from('leaderboard_settings').insert([{
      dog_id: dogData.id,
      city: ownerCity,
      visibility: newDog.visibility,
      display_name: newDog.name,
    }])
    setSuccess(true)
    setSaving(false)
    setAddingDog(false)
    setNewDog({ name: '', breed: '', weight: '', birthday: '', visibility: 'anonymous' })
    setNewPhotoFile(null)
    setNewPhotoPreview(null)
    fetchDogs(ownerId)
    setTimeout(() => setSuccess(false), 3000)
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vaccine_uploaded', to: 'dev@thecaninegym.com', data: { dogName, ownerName, ownerEmail, photoUrl: urlData.publicUrl, dogId } })
    })
    setVaccineSuccess(dogId)
    setVaccineFiles(prev => { const n = { ...prev }; delete n[dogId]; return n })
    setVaccinePreviews(prev => { const n = { ...prev }; delete n[dogId]; return n })
    setUploadingVaccine(null)
    fetchDogs(ownerId)
    setTimeout(() => setVaccineSuccess(null), 4000)
  }

  const getVaccineBadge = (dogId: string) => {
    const v = vaccines[dogId]
    if (!v) return { color: '#dc3545', bg: '#f8d7da', icon: <ShieldAlert size={14} />, label: 'Vaccines Required' }
    if (v.status === 'approved') return { color: '#28a745', bg: '#d4edda', icon: <ShieldCheck size={14} />, label: 'Vaccines Approved' }
    if (v.status === 'pending') return { color: '#856404', bg: '#fff3cd', icon: <Clock size={14} />, label: 'Vaccines Under Review' }
    if (v.status === 'rejected') return { color: '#dc3545', bg: '#f8d7da', icon: <ShieldAlert size={14} />, label: 'Vaccines Rejected — Re-upload' }
    return { color: '#dc3545', bg: '#f8d7da', icon: <ShieldAlert size={14} />, label: 'Vaccines Required' }
  }

  const getExpiryWarnings = (dogId: string) => {
    const v = vaccines[dogId]
    if (!v || v.status !== 'approved') return []
    const warnings: string[] = []
    const today = new Date()
    const soon = new Date(); soon.setDate(today.getDate() + 30)
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
    <div style={{ minHeight: '100vh', backgroundColor: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'white', fontSize: '18px' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym</h1>
        </div>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#003087', margin: 0 }}>My Dogs</h2>
          {!addingDog && (
            <button onClick={() => { setAddingDog(true); setEditingDog(null); setSuccess(false); setError(null) }}
              style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Dog
            </button>
          )}
        </div>

        {success && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> Saved successfully!
          </div>
        )}
        {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

        {/* Add Dog Form */}
        {addingDog && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#003087', margin: 0 }}>Add New Dog</h3>
              <button onClick={() => { setAddingDog(false); setNewDog({ name: '', breed: '', weight: '', birthday: '', visibility: 'anonymous' }); setNewPhotoPreview(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddDog}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', overflow: 'hidden' }}>
                  {newPhotoPreview ? <img src={newPhotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PawPrint size={36} color="#ccc" />}
                </div>
                <label style={{ cursor: 'pointer', color: '#003087', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Camera size={14} /> Add Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleNewDogPhoto} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Dog's Name *</label>
                  <input required value={newDog.name} onChange={e => setNewDog({ ...newDog, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Breed</label>
                  <select value={newDog.breed} onChange={e => setNewDog({ ...newDog, breed: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }}>
                    <option value="">Select breed</option>
                    {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Weight (lbs)</label>
                  <input type="number" value={newDog.weight} onChange={e => setNewDog({ ...newDog, weight: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Birthday</label>
                  <input type="date" value={newDog.birthday} onChange={e => setNewDog({ ...newDog, birthday: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Leaderboard Visibility</label>
                <select value={newDog.visibility} onChange={e => setNewDog({ ...newDog, visibility: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }}>
                  <option value="public">Public (show name)</option>
                  <option value="anonymous">Anonymous (hide name)</option>
                  <option value="private">Private (not on leaderboard)</option>
                </select>
              </div>
              <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Shield size={18} color="#856404" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, color: '#856404', fontSize: '14px', lineHeight: 1.5 }}>
                  <strong>Vaccines required before booking.</strong> After adding your dog, upload a photo of their vaccine records from this page. We'll review and approve within 24 hours.
                </p>
              </div>
              <button type="submit" disabled={saving}
                style={{ width: '100%', padding: '12px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                {saving ? 'Adding...' : 'Add Dog'}
              </button>
            </form>
          </div>
        )}

        {dogs.length === 0 && !addingDog && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <PawPrint size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#666', marginBottom: '20px' }}>No dogs added yet.</p>
            <button onClick={() => setAddingDog(true)}
              style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Add Your First Dog
            </button>
          </div>
        )}

        {dogs.map((dog: any) => {
          const badge = getVaccineBadge(dog.id)
          const expiryWarnings = getExpiryWarnings(dog.id)
          const vaccine = vaccines[dog.id]
          const isEditing = editingDog?.id === dog.id

          return (
            <div key={dog.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isEditing ? '20px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PawPrint size={28} color="#ccc" />
                    </div>
                  )}
                  <div>
                    <h3 style={{ color: '#003087', margin: '0 0 4px 0', fontSize: '20px' }}>{dog.name}</h3>
                    <p style={{ color: '#666', margin: '0 0 6px 0', fontSize: '14px' }}>{dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {badge.icon} {badge.label}
                    </div>
                  </div>
                </div>
                {!isEditing && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(dog)}
                      style={{ backgroundColor: '#f0f0f0', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => handleDelete(dog.id, dog.name)}
                      style={{ backgroundColor: '#fee2e2', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                )}
              </div>

              {expiryWarnings.length > 0 && !isEditing && (
                <div style={{ marginTop: '12px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '10px 14px' }}>
                  {expiryWarnings.map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#856404', fontSize: '13px', fontWeight: '600', marginBottom: i < expiryWarnings.length - 1 ? '4px' : 0 }}>
                      <AlertTriangle size={13} /> {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Form */}
              {isEditing && (
                <form onSubmit={handleSave}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', overflow: 'hidden' }}>
                      {editingDog.photo_url ? <img src={editingDog.photo_url} alt={editingDog.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PawPrint size={32} color="#ccc" />}
                    </div>
                    <label style={{ cursor: 'pointer', color: '#003087', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Camera size={13} /> {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Dog's Name</label>
                      <input value={editingDog.name} onChange={e => setEditingDog({ ...editingDog, name: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box', color: '#000' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Breed</label>
                      <select value={editingDog.breed} onChange={e => setEditingDog({ ...editingDog, breed: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box', color: '#000' }}>
                        {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Weight (lbs)</label>
                      <input type="number" value={editingDog.weight || ''} onChange={e => setEditingDog({ ...editingDog, weight: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box', color: '#000' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Birthday</label>
                      <input type="date" value={editingDog.birthday?.split('T')[0] || ''} onChange={e => setEditingDog({ ...editingDog, birthday: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box', color: '#000' }} />
                    </div>
                  </div>

                  {/* Vet Info */}
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontWeight: '700', color: '#003087', fontSize: '14px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Stethoscope size={15} /> Veterinarian Info
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Vet's Name</label>
                        <input value={editingDog.vet_name || ''} onChange={e => setEditingDog({ ...editingDog, vet_name: e.target.value })} placeholder="Dr. Smith"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box', color: '#000' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Clinic Name</label>
                        <input value={editingDog.vet_clinic || ''} onChange={e => setEditingDog({ ...editingDog, vet_clinic: e.target.value })} placeholder="Carmel Animal Hospital"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box', color: '#000' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Vet Phone</label>
                        <input type="tel" value={editingDog.vet_phone || ''} onChange={e => setEditingDog({ ...editingDog, vet_phone: e.target.value })} placeholder="(317) 555-0123"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box', color: '#000' }} />
                      </div>
                    </div>
                  </div>

                  {editingDog.leaderboard_settings && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Leaderboard Visibility</label>
                      <select value={editingDog.leaderboard_settings.visibility} onChange={e => setEditingDog({ ...editingDog, leaderboard_settings: { ...editingDog.leaderboard_settings, visibility: e.target.value } })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box', color: '#000' }}>
                        <option value="public">Public (show name)</option>
                        <option value="anonymous">Anonymous (hide name)</option>
                        <option value="private">Private (not on leaderboard)</option>
                      </select>
                    </div>
                  )}

                  {error && <p style={{ color: '#dc3545', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={saving}
                      style={{ flex: 1, padding: '11px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setEditingDog(null)}
                      style={{ padding: '11px 18px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Vaccine Section */}
              {!isEditing && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                  <p style={{ fontWeight: '700', color: '#003087', fontSize: '14px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={15} /> Vaccine Records
                  </p>

                  {vaccine?.status === 'approved' && (
                    <div style={{ marginBottom: '12px', backgroundColor: '#f0f9f4', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '12px 14px' }}>
                      <p style={{ color: '#155724', fontWeight: '600', fontSize: '13px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={14} /> Approved on {new Date(vaccine.reviewed_at).toLocaleDateString()}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[
                          { key: 'rabies_exp', label: 'Rabies' }, { key: 'dhpp_exp', label: 'DHPP' },
                          { key: 'bordetella_exp', label: 'Bordetella' }, { key: 'leptospira_exp', label: 'Leptospira' },
                          { key: 'influenza_exp', label: 'Influenza' },
                        ].map(f => vaccine[f.key] ? (
                          <span key={f.key} style={{ backgroundColor: 'white', border: '1px solid #c3e6cb', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', color: '#155724', fontWeight: '500' }}>
                            {f.label}: {new Date(vaccine[f.key]).toLocaleDateString()}
                          </span>
                        ) : null)}
                      </div>
                      {vaccine.other_vaccines && <p style={{ color: '#555', fontSize: '13px', margin: '8px 0 0 0' }}>Other: {vaccine.other_vaccines}</p>}
                    </div>
                  )}

                  {vaccine?.status === 'rejected' && vaccine.admin_notes && (
                    <div style={{ marginBottom: '12px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '10px 14px' }}>
                      <p style={{ color: '#721c24', fontSize: '13px', margin: 0 }}><strong>Rejection note:</strong> {vaccine.admin_notes}</p>
                    </div>
                  )}

                  {vaccine?.status === 'pending' && (
                    <div style={{ marginBottom: '12px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '10px 14px' }}>
                      <p style={{ color: '#856404', fontSize: '13px', margin: 0 }}>
                        <strong>Submitted {new Date(vaccine.uploaded_at).toLocaleDateString()}.</strong> We'll review and approve within 24 hours.
                      </p>
                    </div>
                  )}

                  {(!vaccine || vaccine.status === 'rejected') && (
                    vaccineSuccess === dog.id ? (
                      <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                        <CheckCircle size={16} /> Uploaded! We'll review within 24 hours.
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: '#666', fontSize: '13px', margin: '0 0 12px 0' }}>Upload a photo of your dog's vaccine record. Required before booking.</p>
                        
                        {vaccinePreviews[dog.id] ? (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={vaccinePreviews[dog.id]} alt="Vaccine record preview" style={{ maxWidth: '100%', width: '280px', height: '180px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #003087', display: 'block' }} />
                              <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: 'white', fontWeight: '600' }}>
                                Preview
                              </div>
                            </div>
                            <p style={{ color: '#555', fontSize: '12px', margin: '6px 0 0 0' }}>{vaccineFiles[dog.id]?.name}</p>
                          </div>
                        ) : (
                          <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '280px', height: '140px', border: '2px dashed #ccc', borderRadius: '10px', backgroundColor: '#fafafa', marginBottom: '12px', gap: '8px' }}>
                            <Upload size={28} color="#aaa" />
                            <span style={{ color: '#888', fontSize: '13px', fontWeight: '600' }}>Click to choose photo</span>
                            <span style={{ color: '#bbb', fontSize: '11px' }}>JPG, PNG or PDF</span>
                            <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) { setVaccineFiles(prev => ({ ...prev, [dog.id]: f })); setVaccinePreviews(prev => ({ ...prev, [dog.id]: URL.createObjectURL(f) })) } }} />
                          </label>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {vaccinePreviews[dog.id] && (
                            <label style={{ cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '9px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Upload size={14} /> Change Photo
                              <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) { setVaccineFiles(prev => ({ ...prev, [dog.id]: f })); setVaccinePreviews(prev => ({ ...prev, [dog.id]: URL.createObjectURL(f) })) } }} />
                            </label>
                          )}
                          {vaccineFiles[dog.id] && (
                            <button onClick={() => handleVaccineUpload(dog.id, dog.name)} disabled={uploadingVaccine === dog.id}
                              style={{ backgroundColor: '#003087', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {uploadingVaccine === dog.id ? 'Uploading...' : <><Shield size={13} /> Submit Vaccines</>}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {vaccine?.status === 'approved' && (
                    <div style={{ marginTop: '10px' }}>
                      {vaccineSuccess === dog.id ? (
                        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                          <CheckCircle size={16} /> New records submitted for review.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <label style={{ cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', color: '#555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Upload size={12} /> Update Vaccine Records
                            <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) { setVaccineFiles(prev => ({ ...prev, [dog.id]: f })); setVaccinePreviews(prev => ({ ...prev, [dog.id]: URL.createObjectURL(f) })) } }} />
                          </label>
                          {vaccineFiles[dog.id] && (
                            <button onClick={() => handleVaccineUpload(dog.id, dog.name)} disabled={uploadingVaccine === dog.id}
                              style={{ backgroundColor: '#003087', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                              {uploadingVaccine === dog.id ? 'Uploading...' : 'Submit'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(dog.vet_name || dog.vet_clinic || dog.vet_phone) && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {dog.vet_clinic && <span style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {dog.vet_clinic}</span>}
                      {dog.vet_name && <span style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Stethoscope size={12} /> {dog.vet_name}</span>}
                      {dog.vet_phone && <span style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {dog.vet_phone}</span>}
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