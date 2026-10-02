export type OutreachTone = 'consultative' | 'urgent' | 'friendly' | 'professional'

export type OutreachChannel = 'whatsapp' | 'email' | 'sms' | 'follow_up'

export interface OutreachResponse {
  whatsapp: string
  email_subject: string
  email_body: string
  sms: string
  follow_up_note: string
}
