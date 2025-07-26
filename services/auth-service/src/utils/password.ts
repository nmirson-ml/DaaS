import bcrypt from 'bcrypt'
import { config } from '@/config'
import { logger } from './logger'

export class PasswordService {
  /**
   * Hash a password using bcrypt
   */
  static async hash(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(config.bcryptRounds)
      return await bcrypt.hash(password, salt)
    } catch (error) {
      logger.error('Failed to hash password', { error: error.message })
      throw new Error('Password hashing failed')
    }
  }

  /**
   * Verify a password against its hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      logger.error('Failed to verify password', { error: error.message })
      return false
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    // Maximum length (prevent DoS attacks)
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long')
    }

    // Must contain uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    // Must contain lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    // Must contain number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    // Must contain special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Common weak passwords
    const commonPasswords = [
      'password', 'password123', '123456', '123456789', 'qwerty',
      'abc123', 'password1', 'admin', 'letmein', 'welcome'
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    // Ensure at least one character from each category
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*'

    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
}