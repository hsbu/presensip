export type UserRole = 'lecturer' | 'admin'

export interface AppUser {
  uid: string
  email: string
  role: UserRole
  displayName: string
  fcmToken?: string
}

export interface Session {
  sessionId: string
  classroomId: string
  lecturerId: string
  courseCode: string
  startTime: number        // Unix ms
  endTime?: number
  status: 'active' | 'closed' | 'pending_verification'
  headCountIntervalMinutes: number
  presentCount: number
  headCount?: number       // populated when session closes
}

export interface AttendanceRecord {
  studentId: string
  sessionId: string
  classroomId: string
  timestamp: number
  confidence: number
}

export interface HeadCountEntry {
  count: number
  timestamp: number
}

export interface Alert {
  sessionId: string
  classroomId: string
  biometricCount: number
  physicalCount: number
  delta: number
  timestamp: number
}

export interface Enrollment {
  studentId: string
  studentName: string
  embedding: number[]     // 128D dlib embedding
  enrolledAt: number
  enrolledBy: string      // admin uid
}
