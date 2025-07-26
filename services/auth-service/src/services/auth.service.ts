import { logger } from '../utils/logger';
import { JWTService } from './jwt.service';

export interface User {
  id: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest {
  email: string;
  password?: string;
  tenantId?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  expiresIn?: number;
  error?: string;
}

export interface ApiKey {
  id: string;
  key: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

// In-memory storage for MVP
const users = new Map<string, User>();
const apiKeys = new Map<string, ApiKey>();
const tenants = new Map<string, { id: string; name: string; plan: string }>();

export class AuthService {
  private jwtService: JWTService;

  constructor() {
    this.jwtService = new JWTService();
    this.initializeSampleData();
  }

  /**
   * Authenticate user and generate JWT token
   */
  async authenticate(request: AuthRequest): Promise<AuthResponse> {
    try {
      // For MVP, create user if doesn't exist (simplified auth)
      let user = Array.from(users.values()).find(u => u.email === request.email);
      
      if (!user) {
        // Create new user for demo
        user = await this.createUser({
          email: request.email,
          tenantId: request.tenantId || 'demo-tenant',
          role: 'admin'
        });
      }

      // Generate JWT token
      const token = await this.jwtService.generateToken({
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role
      });

      logger.info(`User authenticated: ${user.email} (${user.tenantId})`);

      return {
        success: true,
        token,
        user,
        expiresIn: 3600 // 1 hour
      };
    } catch (error) {
      logger.error('Authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<{ valid: boolean; user?: User; error?: string }> {
    try {
      const payload = await this.jwtService.verifyToken(token);
      
      const user = users.get(payload.userId);
      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      return { valid: true, user };
    } catch (error) {
      logger.error('Token validation failed:', error);
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid token' 
      };
    }
  }

  /**
   * Create new user
   */
  async createUser(data: {
    email: string;
    tenantId: string;
    role: 'admin' | 'user' | 'viewer';
  }): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: data.email,
      tenantId: data.tenantId,
      role: data.role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.set(user.id, user);
    logger.info(`User created: ${user.email} (${user.tenantId})`);
    return user;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    return users.get(userId) || null;
  }

  /**
   * Get users by tenant
   */
  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return Array.from(users.values()).filter(user => user.tenantId === tenantId);
  }

  /**
   * Generate API key for tenant
   */
  async generateApiKey(tenantId: string, name: string): Promise<ApiKey> {
    const apiKey: ApiKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: `daas_${Math.random().toString(36).substr(2, 32)}`,
      tenantId,
      name,
      isActive: true,
      createdAt: new Date()
    };

    apiKeys.set(apiKey.key, apiKey);
    logger.info(`API key generated: ${name} (${tenantId})`);
    return apiKey;
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<{ valid: boolean; tenantId?: string; error?: string }> {
    const apiKey = apiKeys.get(key);
    
    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (!apiKey.isActive) {
      return { valid: false, error: 'API key is disabled' };
    }

    return { valid: true, tenantId: apiKey.tenantId };
  }

  /**
   * Get API keys for tenant
   */
  async getApiKeys(tenantId: string): Promise<ApiKey[]> {
    return Array.from(apiKeys.values()).filter(key => key.tenantId === tenantId);
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string, tenantId: string): Promise<boolean> {
    const apiKey = Array.from(apiKeys.values()).find(key => key.id === keyId && key.tenantId === tenantId);
    
    if (!apiKey) {
      return false;
    }

    apiKey.isActive = false;
    logger.info(`API key revoked: ${apiKey.name} (${tenantId})`);
    return true;
  }

  /**
   * Create tenant
   */
  async createTenant(data: { name: string; plan: string }): Promise<{ id: string; name: string; plan: string }> {
    const tenant = {
      id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      plan: data.plan
    };

    tenants.set(tenant.id, tenant);
    logger.info(`Tenant created: ${tenant.name}`);
    return tenant;
  }

  /**
   * Get tenant
   */
  async getTenant(tenantId: string): Promise<{ id: string; name: string; plan: string } | null> {
    return tenants.get(tenantId) || null;
  }

  /**
   * Extract user from request headers
   */
  async extractUserFromRequest(headers: Record<string, string>): Promise<{ user?: User; tenantId?: string; error?: string }> {
    try {
      const authHeader = headers.authorization;
      const apiKeyHeader = headers['x-api-key'];
      const tenantIdHeader = headers['x-tenant-id'];

      // Check JWT token
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const result = await this.validateToken(token);
        
        if (result.valid && result.user) {
          return { user: result.user, tenantId: result.user.tenantId };
        }
      }

      // Check API key
      if (apiKeyHeader) {
        const result = await this.validateApiKey(apiKeyHeader);
        
        if (result.valid && result.tenantId) {
          return { tenantId: result.tenantId };
        }
      }

      // Default tenant for demo
      if (tenantIdHeader) {
        return { tenantId: tenantIdHeader };
      }

      // Return demo tenant for MVP
      return { tenantId: 'demo-tenant' };
    } catch (error) {
      logger.error('Error extracting user from request:', error);
      return { error: 'Authentication failed' };
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(user: User, resource: string, action: string): Promise<boolean> {
    // Simple role-based permissions for MVP
    if (user.role === 'admin') {
      return true; // Admin can do everything
    }

    if (user.role === 'user') {
      // Users can read/write their own tenant's resources
      return ['read', 'write'].includes(action);
    }

    if (user.role === 'viewer') {
      // Viewers can only read
      return action === 'read';
    }

    return false;
  }

  /**
   * Initialize sample data for demo
   */
  private async initializeSampleData(): Promise<void> {
    try {
      // Create demo tenant
      await this.createTenant({
        name: 'Demo Company',
        plan: 'enterprise'
      });

      // Create sample admin user
      await this.createUser({
        email: 'admin@demo.com',
        tenantId: 'demo-tenant',
        role: 'admin'
      });

      // Create sample API key
      await this.generateApiKey('demo-tenant', 'Demo API Key');

      logger.info('Sample auth data initialized');
    } catch (error) {
      logger.error('Error initializing sample auth data:', error);
    }
  }

  /**
   * Get auth statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    totalTenants: number;
    totalApiKeys: number;
    activeApiKeys: number;
  }> {
    return {
      totalUsers: users.size,
      totalTenants: tenants.size,
      totalApiKeys: apiKeys.size,
      activeApiKeys: Array.from(apiKeys.values()).filter(key => key.isActive).length
    };
  }
}