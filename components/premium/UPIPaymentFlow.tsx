'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeSVG } from 'qrcode.react'
import { generateUPILink } from '@/lib/utils'
import { 
  Copy, Check, Loader2, CheckCircle2, 
  ShieldCheck, Smartphone, ArrowRight, 
  AlertCircle, Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface UPIPaymentFlowProps {
  upiId: string
  name: string
  amount: number
}

const UPI_APPS = [
  { name: 'PhonePe', color: '#5f259f', emoji: '📱' },
  { name: 'GPay', color: '#1a73e8', emoji: '🔵' },
  { name: 'Paytm', color: '#00BAF2', emoji: '💙' },
  { name: 'BHIM', color: '#00875A', emoji: '🟢' },
]

export function UPIPaymentFlow({ upiId, name, amount }: UPIPaymentFlowProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [utrNumber, setUtrNumber] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const upiLink = generateUPILink({ upiId, name, amount })

  const handleCopyUpiId = async () => {
    await navigator.clipboard.writeText(upiId)
    setCopiedId(true)
    toast.success('UPI ID copied!')
    setTimeout(() => setCopiedId(false), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || utrNumber.length < 10) {
      toast.error('Please enter your email and a valid UTR/Reference number.')
      return
    }

    setClaiming(true)
    try {
      const res = await fetch('/api/premium/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, utrNumber })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to claim premium code')
        return
      }
      setGeneratedCode(data.code)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setClaiming(false)
    }
  }

  // ── SUCCESS STATE ─────────────────────────────────────
  if (generatedCode) {
    return (
      <div className="animate-fade-in-up space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-green-50">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">Payment Received! 🎉</h3>
          <p className="text-slate-500 text-sm">Your premium code has been generated successfully.</p>
        </div>

        {/* Code Box */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 text-center">
          <p className="text-xs text-indigo-400 font-bold tracking-[0.2em] uppercase mb-3">Your Premium Code</p>
          <div className="text-3xl font-mono font-bold text-indigo-700 tracking-widest mb-4 select-all">
            {generatedCode}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            onClick={() => {
              navigator.clipboard.writeText(generatedCode)
              setCopied(true)
              toast.success('Code copied!')
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>

        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
          <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
          A copy has been sent to <strong>{email}</strong>
        </div>

        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold"
          onClick={() => {
            navigator.clipboard.writeText(generatedCode)
            document.getElementById('redeem-section')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Copy & Redeem Now <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    )
  }

  // ── PAYMENT FLOW ──────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors ${step === 1 ? 'text-indigo-700' : 'text-slate-400'}`}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step === 1 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-400'}`}>1</span>
          Pay
        </button>
        <div className="flex-1 h-0.5 bg-slate-200 rounded-full">
          <div className={`h-full bg-indigo-500 rounded-full transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`} />
        </div>
        <button
          onClick={() => utrNumber || email ? setStep(2) : undefined}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors ${step === 2 ? 'text-indigo-700' : 'text-slate-400'}`}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step === 2 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-400'}`}>2</span>
          Verify
        </button>
      </div>

      {/* ── STEP 1: Pay ── */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in-up">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* QR Code */}
              <div className="shrink-0">
                <div className="bg-white p-3 rounded-xl border-2 border-slate-100 shadow-md">
                  <QRCodeSVG value={upiLink} size={140} level="H" />
                </div>
                <p className="text-center text-xs text-slate-400 mt-2 font-medium">Scan to Pay</p>
              </div>

              <div className="flex-1 w-full">
                <div className="text-center sm:text-left mb-4">
                  <p className="text-3xl font-extrabold text-slate-900 mb-0.5">₹{amount}</p>
                  <p className="text-slate-500 text-sm">One-time payment, 30 days Premium</p>
                </div>

                {/* UPI ID Copy */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">UPI ID</p>
                    <p className="font-mono font-semibold text-slate-800 text-sm">{upiId}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleCopyUpiId} className="text-indigo-600 hover:bg-indigo-50 shrink-0">
                    {copiedId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {/* App Icons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Pay via:</span>
                  {UPI_APPS.map(app => (
                    <span key={app.name} className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                      {app.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Notice */}
          <div className="flex items-start gap-3 text-sm text-slate-500 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p>After paying, note down your <strong className="text-slate-700">12-digit UTR/Reference number</strong> from your UPI app's transaction history. You'll need it in Step 2.</p>
          </div>

          <Button
            onClick={() => setStep(2)}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-base font-semibold"
          >
            I've Paid — Continue <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ── STEP 2: Verify ── */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in-up">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-1">Enter Payment Details</h4>
            <p className="text-sm text-slate-500 mb-5">We'll verify your payment and instantly generate your premium code.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
                <p className="text-xs text-slate-400">Your premium code will be sent here too.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="utr" className="text-sm font-medium">
                  UTR / Reference Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="utr"
                  type="text"
                  inputMode="numeric"
                  placeholder="12-digit transaction ID (e.g. 308945678912)"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                  className="h-11 font-mono tracking-wider"
                  required
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Found in your UPI app → transaction history</p>
                  <p className={`text-xs font-mono ${utrNumber.length === 12 ? 'text-green-600' : 'text-slate-400'}`}>
                    {utrNumber.length}/12
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-base font-semibold mt-2"
                disabled={claiming || !email || utrNumber.length < 10}
              >
                {claiming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                {claiming ? 'Verifying Payment...' : 'Verify & Get Premium Code'}
              </Button>
            </form>
          </div>

          <button
            onClick={() => setStep(1)}
            className="text-sm text-slate-400 hover:text-indigo-600 transition-colors w-full text-center"
          >
            ← Back to payment
          </button>
        </div>
      )}
    </div>
  )
}
