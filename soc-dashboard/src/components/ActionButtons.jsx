import React, { useState } from 'react'
import {
  Ban,
  CheckCircle,
  Zap,
  Loader2,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react'

import axios from 'axios'

const BACKEND_URL = 'http://10.95.23.27:8000/action'

export default function ActionButtons({
  hostname,
  log
}) {

  const [loading, setLoading] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // =========================================
  // DETECT PROCESS FROM EVENT
  // =========================================

  const message =
    (
      log?.message ||
      log?.event?.original ||
      ''
    ).toLowerCase()

  let detectedProcess = null

  if (
    message.includes('powershell')
  ) {

    detectedProcess = 'powershell.exe'

  }

  else if (
    message.includes('cmd.exe') ||
    message.includes('cmd ')
  ) {

    detectedProcess = 'cmd.exe'

  }

  // =========================================
  // BUILD DYNAMIC ACTIONS
  // =========================================

  const ACTIONS = []

  if (detectedProcess) {

    ACTIONS.push(

      {
        label: `Kill ${detectedProcess}`,
        icon: Zap,
        action: 'kill_process',
        target: detectedProcess,
        cls: 'btn-kill'
      },

      {
        label: `Block ${detectedProcess}`,
        icon: ShieldAlert,
        action: 'block_executable',
        target: detectedProcess,
        cls: 'btn-block'
      },

      {
        label: `Unblock ${detectedProcess}`,
        icon: ShieldCheck,
        action: 'unblock_executable',
        target: detectedProcess,
        cls: 'btn-allow'
      }
    )
  }

  // =========================================
  // SHUTDOWN ALWAYS AVAILABLE
  // =========================================

  ACTIONS.push({

    label: 'Shutdown',
    icon: CheckCircle,
    action: 'shutdown',
    target: 'none',
    cls: 'btn-critical'
  })

  // =========================================
  // SEND ACTION
  // =========================================

  const sendAction = async (
    action,
    target,
    label
  ) => {

    if (!hostname) {

      setFeedback({
        ok: false,
        msg: 'No hostname'
      })

      return
    }

    setLoading(label)
    setFeedback(null)

    try {

      console.log('Sending action:', {
        hostname,
        action,
        target
      })

      const res = await axios.post(
        BACKEND_URL,
        {
          hostname,
          action,
          target
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      setFeedback({
        ok: true,
        msg: res.data?.message ?? `${label} sent`
      })

    } catch (err) {

      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Error'

      setFeedback({
        ok: false,
        msg: detail
      })

      console.error(
        'Action error:',
        err.response?.data ?? err
      )

    } finally {

      setLoading(null)

    }
  }

  // =========================================
  // RENDER
  // =========================================

  return (

    <div className="flex flex-col gap-1.5">

      <div className="flex flex-wrap items-center gap-1">

        {ACTIONS.map(({
          label,
          icon: Icon,
          action,
          target,
          cls
        }) => (

          <button
            key={label}
            disabled={!!loading}
            onClick={(e) => {

              e.stopPropagation()

              sendAction(
                action,
                target,
                label
              )
            }}
            className={`
              ${cls}
              disabled:opacity-50
              flex
              items-center
              gap-1
            `}
            title={`${label} on ${hostname || 'unknown'}`}
          >

            {loading === label ? (

              <Loader2
                size={10}
                className="animate-spin"
              />

            ) : (

              <Icon size={10} />

            )}

            <span>{label}</span>

          </button>

        ))}

      </div>

      {feedback && (

        <div
          className={`
            text-[10px]
            font-mono
            px-2
            py-1
            rounded-lg
            font-semibold
            ${
              feedback.ok
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            }
          `}
          style={{
            border: `1px solid ${
              feedback.ok
                ? '#a7f3d0'
                : '#fecaca'
            }`
          }}
        >

          {feedback.ok ? '✓ ' : '✗ '}
          {feedback.msg}

        </div>

      )}

    </div>
  )
}
