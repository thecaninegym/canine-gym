'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

      const { data: ownerData } = await supabase
        .from('owners')
        .select('id, city')
        .eq('email', user.email)
        .single()

      if (ownerData) {
        setOwnerId(ownerData.id)
        setOwnerCity(ownerData.city || '')
        fetchDogs(ownerData.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  const fetchDogs = async (ownerId: string) => {
    const { data } = await supabase
      .from('dogs')
      .select('*, leaderboard_settings(city, visibility, display_name)')
      .eq('owner_id', ownerId)
      .order('name')
    setDogs(data || [])
  }

  const handleEdit = (dog: any) => {
    setEditingDog({ ...dog })
    setAddingDog(false)
    setSuccess(false)
    setError(null)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingDog) return
    setUploadingPhoto(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${editingDog.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('dog-photos')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError('Photo upload failed: ' + uploadError.message)
      setUploadingPhoto(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('dog-photos')
      .getPublicUrl(fileName)

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

    const { error: dogError } = await supabase
      .from('dogs')
      .update({
        name: editingDog.name,
        breed: editingDog.breed,
        weight: editingDog.weight,
        birthday: editingDog.birthday,
        photo_url: editingDog.photo_url
      })
      .eq('id', editingDog.id)

    if (dogError) { setError(dogError.message); setSaving(false); return }

    await supabase
      .from('leaderboard_settings')
      .update({
        visibility: editingDog.leaderboard_settings?.visibility,
        display_name: editingDog.leaderboard_settings?.display_name || editingDog.name
      })
      .eq('dog_id', editingDog.id)

    setSuccess(true)
    setSaving(false)
    fetchDogs(ownerId)
    setTimeout(() => { setEditingDog(null); setSuccess(false) }, 1500)
  }

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: dogData, error: dogError } = await supabase
      .from('dogs')
      .insert([{ owner_id: ownerId, name: newDog.name, breed: newDog.breed, weight: newDog.weight || null, birthday: newDog.birthday || null }])
      .select()

    if (dogError) { setError(dogError.message); setSaving(false); return }

    const dogId = dogData[0].id

    // Upload photo if selected
    if (newPhotoFile) {
      const fileExt = newPhotoFile.name.split('.').pop()
      const fileName = `${dogId}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, newPhotoFile, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(fileName)
        await supabase.from('dogs').update({ photo_url: urlData.publicUrl }).eq('id', dogId)
      }
    }

    await supabase
      .from('leaderboard_settings')
      .insert([{ dog_id: dogId, visibility: 'anonymous', display_name: newDog.name, city: ownerCity }])

    setNewDog({ name: '', breed: '', weight: '', birthday: '' })
    setNewPhotoFile(null)
    setNewPhotoPreview(null)
    setAddingDog(false)
    setSaving(false)
    fetchDogs(ownerId)
  }

  const handleRemoveDog = async (dogId: string, dogName: string) => {
    if (!confirm(`Are you sure you want to remove ${dogName}? This cannot be undone.`)) return
    await supabase.from('leaderboard_settings').delete().eq('dog_id', dogId)
    await supabase.from('dog_achievements').delete().eq('dog_id', dogId)
    await supabase.from('bookings').delete().eq('dog_id', dogId)
    await supabase.from('dogs').delete().eq('id', dogId)
    fetchDogs(ownerId)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym</h1>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#003087', margin: 0 }}>My Dogs</h2>
          <button onClick={() => { setAddingDog(true); setEditingDog(null) }}
            style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Add Dog
          </button>
        </div>

        {/* Add Dog Form */}
        {addingDog && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
            <h3 style={{ color: '#003087', margin: '0 0 20px 0' }}>Add a New Dog</h3>
            <form onSubmit={handleAddDog}>
              {/* Photo upload */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {newPhotoPreview ? (
                  <img src={newPhotoPreview} alt="Preview"
                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px' }} />
                ) : (
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontSize: '40px' }}>🐾</div>
                )}
                <label style={{ display: 'block', cursor: 'pointer', color: '#FF6B35', fontWeight: 'bold', fontSize: '14px' }}>
                  📷 {newPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/*" onChange={handleNewDogPhoto} style={{ display: 'none' }} />
                </label>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Dog Name</label>
                <input type="text" value={newDog.name} onChange={(e) => setNewDog({ ...newDog, name: e.target.value })} required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Breed</label>
                <input type="text" value={newDog.breed} onChange={(e) => setNewDog({ ...newDog, breed: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Weight (lbs)</label>
                <input type="number" value={newDog.weight} onChange={(e) => setNewDog({ ...newDog, weight: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Birthday</label>
                <input type="date" value={newDog.birthday} onChange={(e) => setNewDog({ ...newDog, birthday: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
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
            <p style={{ color: '#666' }}>No dogs yet — add your first dog above!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {dogs.map(dog => (
              <div key={dog.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {editingDog?.id === dog.id ? (
                  <form onSubmit={handleSave}>
                    {success && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>Saved!</div>}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      {editingDog.photo_url ? (
                        <img src={editingDog.photo_url} alt={editingDog.name}
                          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px' }} />
                      ) : (
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontSize: '40px' }}>🐾</div>
                      )}
                      <label style={{ display: 'block', cursor: 'pointer', color: '#FF6B35', fontWeight: 'bold', fontSize: '14px' }}>
                        {uploadingPhoto ? 'Uploading...' : '📷 Upload Photo'}
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Dog Name</label>
                      <input type="text" value={editingDog.name} onChange={(e) => setEditingDog({ ...editingDog, name: e.target.value })} required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Breed</label>
                      <input type="text" value={editingDog.breed || ''} onChange={(e) => setEditingDog({ ...editingDog, breed: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Weight (lbs)</label>
                      <input type="number" value={editingDog.weight || ''} onChange={(e) => setEditingDog({ ...editingDog, weight: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Birthday</label>
                      <input type="date" value={editingDog.birthday || ''} onChange={(e) => setEditingDog({ ...editingDog, birthday: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
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
                        style={{ padding: '12px 20px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {dog.photo_url ? (
                      <img src={dog.photo_url} alt={dog.name}
                        style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0 }}>🐾</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: '#003087', margin: '0 0 4px 0', fontSize: '18px' }}>{dog.name}</h3>
                      <p style={{ color: '#666', margin: '0 0 2px 0', fontSize: '14px' }}>{dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''}</p>
                      <p style={{ color: '#999', margin: 0, fontSize: '13px' }}>{dog.leaderboard_settings?.visibility}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(dog)}
                        style={{ backgroundColor: '#003087', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                        Edit
                      </button>
                      <button onClick={() => handleRemoveDog(dog.id, dog.name)}
                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                        Remove
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