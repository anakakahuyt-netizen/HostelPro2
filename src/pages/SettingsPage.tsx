import { Bell, Palette, Lock, Eye, EyeOff, Save, X, Download, Upload } from 'lucide-react'
import React, { useState, useRef } from 'react'
import { exportBackup, importBackup } from '../services/backup'
import { showToast } from '../services/toast'

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [theme, setTheme] = useState('Dark')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [currency, setCurrency] = useState('USD ($)')
  const [language, setLanguage] = useState('English')
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
    'Payment Reminders': true,
    'Room Updates': true,
    'New Boarders': true,
    'Maintenance Issues': true,
    'Weekly Reports': false,
    'System Alerts': true,
  })
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/json' && !f.name.toLowerCase().endsWith('.json')) {
      showToast('Please choose a valid JSON backup file')
      e.target.value = ''
      return
    }

    try {
      await importBackup(f)
      showToast('Backup imported successfully')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to import backup')
    } finally {
      e.target.value = ''
    }
  }

  const handleThemeSelect = (selectedTheme: string) => {
    setTheme(selectedTheme)
    showToast(`${selectedTheme} theme selected`)
  }

  const handleSettingChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value)
    showToast(`${value} selected`)
  }

  const handleToggleNotification = (name: string) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: !prev[name] }))
    showToast(`${name} ${notificationSettings[name] ? 'disabled' : 'enabled'}`)
  }

  const handleSave = () => {
    showToast('Settings saved successfully')
  }

  const handleCancel = () => {
    showToast('Changes canceled')
  }

  const handleExportBackup = () => {
    try {
      exportBackup()
      showToast('Backup export started')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to export backup')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <section>
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Configuration</p>
          <h1 className="mt-2 text-4xl font-bold text-white">Settings</h1>
          <p className="mt-3 text-slate-400">Manage your account and application preferences</p>
        </div>
      </section>

      {/* Account Settings */}
      <section className="max-w-4xl space-y-6">
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/20">
          <div className="mb-8 flex items-center gap-4 border-b border-slate-800/50 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-500 to-sky-500 text-2xl font-bold text-white">
              AP
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Admin Profile</h2>
              <p className="text-sm text-slate-400">admin@hostel-pro.com</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">First Name</label>
                <input
                  type="text"
                  defaultValue="Admin"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Last Name</label>
                <input
                  type="text"
                  defaultValue="Manager"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Email Address</label>
              <input
                type="email"
                defaultValue="admin@hostel-pro.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Phone Number</label>
              <input
                type="tel"
                defaultValue="+1 (555) 123-4567"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Hostel Name</label>
              <input
                type="text"
                defaultValue="Hostel Pro"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/20">
          <div className="mb-8 flex items-center gap-3 border-b border-slate-800/50 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-400">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white placeholder-slate-500 transition focus:border-rose-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 transition focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 transition focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
              <p className="text-sm text-rose-300">Password must be at least 8 characters with uppercase, lowercase, and numbers.</p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/20">
          <div className="mb-8 flex items-center gap-3 border-b border-slate-800/50 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-400">
              <Palette className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">Preferences</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Theme</label>
              <div className="flex gap-3">
                {['Dark', 'Light', 'Auto'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleThemeSelect(option)}
                    className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition ${
                      option === theme
                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Date Format</label>
              <select value={dateFormat} onChange={(e) => handleSettingChange(setDateFormat, e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white transition focus:border-sky-500 focus:outline-none">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Currency</label>
              <select value={currency} onChange={(e) => handleSettingChange(setCurrency, e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white transition focus:border-sky-500 focus:outline-none">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
                <option>INR (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-[0.28em] text-slate-500 mb-3">Language</label>
              <select value={language} onChange={(e) => handleSettingChange(setLanguage, e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white transition focus:border-sky-500 focus:outline-none">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/20">
          <div className="mb-8 flex items-center gap-3 border-b border-slate-800/50 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-500/15 text-sky-400">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Payment Reminders', desc: 'Get notified about pending payments' },
              { name: 'Room Updates', desc: 'Updates when rooms become available' },
              { name: 'New Boarders', desc: 'Alerts for new check-ins' },
              { name: 'Maintenance Issues', desc: 'Reports of maintenance requests' },
              { name: 'Weekly Reports', desc: 'Summary reports every Monday' },
              { name: 'System Alerts', desc: 'Critical system notifications' },
            ].map((notif) => (
              <div key={notif.name} className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-950/50 px-4 py-4">
                <div>
                  <p className="font-medium text-white">{notif.name}</p>
                  <p className="text-xs text-slate-400">{notif.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification(notif.name)}
                  className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${notificationSettings[notif.name] ? 'bg-emerald-500/30' : 'bg-slate-700/50'}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white transition ${notificationSettings[notif.name] ? 'ml-auto' : 'ml-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <button type="button" onClick={handleCancel} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 font-semibold text-slate-300 transition hover:bg-slate-800">
              <X className="h-5 w-5" />
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:shadow-lg hover:shadow-emerald-500/50">
              <Save className="h-5 w-5" />
              Save Changes
            </button>
          </div>

          <div className="flex gap-3">
            <input ref={(el) => { fileRef.current = el }} onChange={handleImport} type="file" id="backup-input" accept="application/json" className="hidden" />
            <button type="button" onClick={handleExportBackup} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 font-semibold text-slate-300 transition hover:bg-slate-800">
              <Download className="h-5 w-5" />
              Export Backup
            </button>
            <label htmlFor="backup-input" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 font-semibold text-slate-300 cursor-pointer">
              <Upload className="h-5 w-5" />
              Import Backup
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}
