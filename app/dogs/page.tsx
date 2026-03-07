'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, Camera, Plus, CheckCircle, Trash2, Pencil, X } from 'lucide-react'

const BREEDS = ['Affenpinscher','Afghan Hound','Airedale Terrier','Akita','Alaskan Malamute','American Bulldog','American Eskimo Dog','American Foxhound','American Pit Bull Terrier','American Staffordshire Terrier','Australian Cattle Dog','Australian Shepherd','Australian Terrier','Basenji','Basset Hound','Beagle','Bearded Collie','Bedlington Terrier','Belgian Malinois','Belgian Sheepdog','Belgian Tervuren','Bernese Mountain Dog','Bichon Frise','Black and Tan Coonhound','Bloodhound','Border Collie','Border Terrier','Borzoi','Boston Terrier','Bouvier des Flandres','Boxer','Boykin Spaniel','Briard','Brittany','Brussels Griffon','Bull Terrier','Bulldog','Bullmastiff','Cairn Terrier','Cane Corso','Cavalier King Charles Spaniel','Chesapeake Bay Retriever','Chihuahua','Chinese Crested','Chinese Shar-Pei','Chow Chow','Cocker Spaniel','Collie','Dachshund','Dalmatian','Doberman Pinscher','Dogue de Bordeaux','English Setter','English Springer Spaniel','Flat-Coated Retriever','French Bulldog','German Pinscher','German Shepherd','German Shorthaired Pointer','German Wirehaired Pointer','Giant Schnauzer','Golden Retriever','Gordon Setter','Great Dane','Great Pyrenees','Greater Swiss Mountain Dog','Greyhound','Havanese','Ibizan Hound','Irish Setter','Irish Terrier','Irish Water Spaniel','Irish Wolfhound','Italian Greyhound','Jack Russell Terrier','Japanese Chin','Keeshond','Kerry Blue Terrier','Komondor','Kuvasz','Labrador Retriever','Lhasa Apso','Maltese','Mastiff','Miniature Pinscher','Miniature Schnauzer','Newfoundland','Norfolk Terrier','Norwegian Elkhound','Norwich Terrier','Old English Sheepdog','Papillon','Pekingese','Pembroke Welsh Corgi','Pointer','Pomeranian','Poodle (Miniature)','Poodle (Standard)','Poodle (Toy)','Portuguese Water Dog','Pug','Rat Terrier','Redbone Coonhound','Rhodesian Ridgeback','Rottweiler','Saint Bernard','Samoyed','Schipperke','Scottish Deerhound','Scottish Terrier','Shetland Sheepdog','Shiba Inu','Shih Tzu','Siberian Husky','Silky Terrier','Soft Coated Wheaten Terrier','Staffordshire Bull Terrier','Standard Schnauzer','Sussex Spaniel','Tibetan Mastiff','Tibetan Terrier','Vizsla','Weimaraner','Welsh Springer Spaniel','Welsh Terrier','West Highland White Terrier','Whippet','Wire Fox Terrier','Wirehaired Pointing Griffon','Xoloitzcuintli','Yorkshire Terrier','Mixed Breed','Other']

export default function MyDogs() {
  const [dogs, setDogs] = useState<any[]>([])
  const [ownerId, setOwnerId] = useState('')
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
  const [newDog, setNewDog] = useState({ name: '', breed: '', weight: '', birthday: '' })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: ownerData } = await supabase.from('owners').select('id, city').eq('email', user.email).single()
      if (ownerData) { setOwnerId(ownerData.id); setOwnerCity(ownerData.city || ''); fetchDogs(ownerData.id) }
      setLoading(false)
    }
    init()
  }, [])

  const fetchDogs = async (ownerId: string) => {
    const { data } = await supabase.from('dogs').select('*, leaderboard_settings(city, visibility, display_name)').eq('owner_id', ownerId).order('name')
    setDogs(data || [])
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
    const { error: dogError } = await supabase.from('dogs').update({ name: editingDog.name, breed: editingDog.breed, weight: editingDog.weight, birthday: editingDog.birthday, photo_url: editingDog.photo_url }).eq('id', editingDog.id)
    if (dogError) { setError(dogError.message); setSaving(false); return }
    await supabase.from('leaderboard_settings').update({ visibility: editingDog.leaderboard_settings?.visibility, display_name: editingDog.leaderboard_settings?.display_name || editingDog.name }).eq('dog_id', editingDog.id)
    setSuccess(true)
    setSaving(false)
    fetchDogs(ownerId)
    setTimeout(() => { setEditingDog(null); setSuccess(false) }, 1500)
  }

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data: dogData, error: dogError } = await supabase.from('dogs').insert([{ owner_id: ownerId, name: newDog.name, breed: newDog.breed, weight: newDog.weight || null, birthday: newDog.birthday || null }]).select()
    if (dogError) { setError(dogError.message); setSaving(false); return }
    const dogId = dogData[0].id
    if (newPhotoFile) {
      const fileName = `${dogId}.${newPhotoFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('dog-photos').upload(fileName, newPhotoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(fileName)
        await supabase.from('dogs').update({ photo_url: urlData.publicUrl }).eq('id', dogId)
      }
    }
    await supabase.from('leaderboard_settings').insert([{ dog_id: dogId, visibility: 'anonymous', display_name: newDog.name, city: ownerCity }])
    setNewDog({ name: '', breed: '', weight: '', birthday: '' })
    setNewPhotoFile(null)
    setNewPhotoPreview(null)
    setAddingDog(false)
    setSaving(false)
    window.location.href = '/dashboard'
  }

  const handleRemoveDog = async (dogId: string, dogName: string) => {
    if (!confirm(`Are you sure you want to remove ${dogName}? This cannot be undone.`)) return
    await supabase.from('leaderboard_settings').delete().eq('dog_id', dogId)
    await supabase.from('dog_achievements').delete().eq('dog_id', dogId)
    await supabase.from('bookings').delete().eq('dog_id', dogId)
    await supabase.from('dogs').delete().eq('id', dogId)
    fetchDogs(ownerId)
  }

  const DogPhotoCircle = ({ photoUrl, name, size = 70 }: { photoUrl?: string, name?: string, size?: number }) => (
    photoUrl ? (
      <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <PawPrint size={size * 0.4} color="#ccc" />
      </div>
    )
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white' }}>Loading...</p>
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
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PawPrint size={28} color="#003087" />
            <h2 style={{ color: '#003087', margin: 0 }}>My Dogs</h2>
          </div>
          <button onClick={() => { setAddingDog(true); setEditingDog(null) }}
            style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Dog
          </button>
        </div>

        {addingDog && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
            <h3 style={{ color: '#003087', margin: '0 0 20px 0' }}>Add a New Dog</h3>
            <form onSubmit={handleAddDog}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <DogPhotoCircle photoUrl={newPhotoPreview || undefined} size={100} />
                <label style={{ display: 'block', cursor: 'pointer', color: '#FF6B35', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Camera size={16} /> {newPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleNewDogPhoto} style={{ display: 'none' }} />
                </label>
              </div>
              {[
                { label: 'Dog Name', key: 'name', type: 'text', required: true },
                { label: 'Weight (lbs)', key: 'weight', type: 'number' },
                { label: 'Birthday', key: 'birthday', type: 'date', max: new Date().toISOString().split('T')[0] },
              ].map(({ label, key, type, required }) => (
                <div key={key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>{label}</label>
                  <input type={type} value={(newDog as any)[key]} onChange={(e) => setNewDog({ ...newDog, [key]: key === 'weight' ? e.target.value.slice(0, 3) : e.target.value })} required={required} max={(key === 'birthday') ? new Date().toISOString().split('T')[0] : undefined}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                </div>
              ))}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Breed</label>
                <select value={newDog.breed} onChange={(e) => setNewDog({ ...newDog, breed: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }}>
                  <option value="">Select a breed...</option>
                  {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {error && <p style={{ color: 'red', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Add Dog'}
                </button>
                <button type="button" onClick={() => { setAddingDog(false); setNewPhotoFile(null); setNewPhotoPreview(null) }}
                  style={{ padding: '12px 20px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {dogs.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <PawPrint size={48} color="#ddd" style={{ marginBottom: '12px' }} />
            <p style={{ color: '#666' }}>No dogs yet — add your first dog above!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {dogs.map(dog => (
              <div key={dog.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {editingDog?.id === dog.id ? (
                  <form onSubmit={handleSave}>
                    {success && (
                      <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} /> Saved!
                      </div>
                    )}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <DogPhotoCircle photoUrl={editingDog.photo_url} name={editingDog.name} size={100} />
                      <label style={{ display: 'block', cursor: 'pointer', color: '#FF6B35', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Camera size={16} /> {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                        </span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                    {[
                      { label: 'Dog Name', key: 'name', type: 'text', required: true },
                      { label: 'Weight (lbs)', key: 'weight', type: 'number' },
                      { label: 'Birthday', key: 'birthday', type: 'date', max: new Date().toISOString().split('T')[0] },
                    ].map(({ label, key, type, required }) => (
                      <div key={key} style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>{label}</label>
                        <input type={type} value={editingDog[key] || ''} onChange={(e) => setEditingDog({ ...editingDog, [key]: key === 'weight' ? e.target.value.slice(0, 3) : e.target.value })} required={required} max={(key === 'birthday') ? new Date().toISOString().split('T')[0] : undefined}
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                      </div>
                    ))}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Breed</label>
                      <select value={editingDog.breed || ''} onChange={(e) => setEditingDog({ ...editingDog, breed: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }}>
                        <option value="">Select a breed...</option>
                        {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Leaderboard Privacy</label>
                      <select value={editingDog.leaderboard_settings?.visibility || 'anonymous'} onChange={(e) => setEditingDog({ ...editingDog, leaderboard_settings: { ...editingDog.leaderboard_settings, visibility: e.target.value } })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }}>
                        <option value="public">Public — show my dog's name</option>
                        <option value="anonymous">Anonymous — show as Mystery Pup</option>
                        <option value="private">Private — don't show on leaderboard</option>
                      </select>
                    </div>
                    {error && <p style={{ color: 'red', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" disabled={saving}
                        style={{ flex: 1, padding: '12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={() => setEditingDog(null)}
                        style={{ padding: '12px 20px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <X size={15} /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <DogPhotoCircle photoUrl={dog.photo_url} name={dog.name} size={70} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: '#003087', margin: '0 0 4px 0', fontSize: '18px' }}>{dog.name}</h3>
                      <p style={{ color: '#666', margin: '0 0 2px 0', fontSize: '14px' }}>{dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''}</p>
                      <p style={{ color: '#999', margin: 0, fontSize: '13px' }}>{dog.leaderboard_settings?.visibility}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(dog)}
                        style={{ backgroundColor: '#003087', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={() => handleRemoveDog(dog.id, dog.name)}
                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}