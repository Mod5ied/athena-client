'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SchoolType = 'PRIMARY' | 'SECONDARY' | 'PRIMARY_SECONDARY';
type LoadingState = 'idle' | 'registering' | 'registered';

export default function Onboard() {
  const router = useRouter();
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  
  const [formData, setFormData] = useState({
    name: '',
    schoolHead: '',
    type: 'PRIMARY' as SchoolType,
    contact: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postalCode: ''
      }
    },
    configuration: {
      timezone: 'Africa/Lagos',
      currency: 'NGN',
      language: 'English'
    }
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const keys = field.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current: any = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.schoolHead || !formData.contact.email) {
      alert('Please fill in all required fields');
      return;
    }

    setLoadingState('registering');

    try {
      const payload = {
        ...formData,
        type: [formData.type], // Convert to array as expected by API
        configuration: {
          ...formData.configuration,
          language: [formData.configuration.language] // Convert to array as expected by API
        }
      };

      const response = await fetch('http://127.0.0.1:8787/api/v1/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setLoadingState('registered');
        // Wait a moment to show success message, then navigate
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        throw new Error('Failed to register school');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register school. Please try again.');
      setLoadingState('idle');
    }
  };

  const getButtonText = () => {
    switch (loadingState) {
      case 'registering': return 'Registering...';
      case 'registered': return 'Registered ✓';
      default: return 'Register School';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Onboarding</h1>
          <p className="text-gray-600">Register your school to get started with SchoolPilot</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h2>
            
            <div>
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                required
                placeholder="Enter school name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="schoolHead">School Head *</Label>
              <Input
                id="schoolHead"
                required
                placeholder="Enter head teacher/principal name"
                value={formData.schoolHead}
                onChange={(e) => handleInputChange('schoolHead', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="type">School Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: SchoolType) => handleInputChange('type', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select school type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIMARY">Primary School</SelectItem>
                  <SelectItem value="SECONDARY">Secondary School</SelectItem>
                  <SelectItem value="PRIMARY_SECONDARY">Primary & Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Contact Information</h2>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="admin@yourschool.edu.ng"
                value={formData.contact.email}
                onChange={(e) => handleInputChange('contact.email', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+234-801-234-5678"
                value={formData.contact.phone}
                onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Education Avenue"
                  value={formData.contact.address.street}
                  onChange={(e) => handleInputChange('contact.address.street', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Lagos"
                  value={formData.contact.address.city}
                  onChange={(e) => handleInputChange('contact.address.city', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Lagos"
                  value={formData.contact.address.state}
                  onChange={(e) => handleInputChange('contact.address.state', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.contact.address.country}
                  onValueChange={(value) => handleInputChange('contact.address.country', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="100001"
                  value={formData.contact.address.postalCode}
                  onChange={(e) => handleInputChange('contact.address.postalCode', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.configuration.timezone}
                  onValueChange={(value) => handleInputChange('configuration.timezone', value)}
                  disabled
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.configuration.currency}
                  onValueChange={(value) => handleInputChange('configuration.currency', value)}
                  disabled
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.configuration.language}
                  onValueChange={(value) => handleInputChange('configuration.language', value)}
                  disabled
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={loadingState !== 'idle'}
              className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                loadingState === 'registered' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {getButtonText()}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}