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
import Image from 'next/image';
import { useSessionStore, type JobRole } from '@/hooks/use-store';
import { useNotifications } from '@/hooks/use-notifications';
import { useSchools } from '@/hooks/use-schools';
const homepageSvg = "/homepage/homepage.svg"

export function LoginForm() {
  const router = useRouter();
  const { showError, showSuccess } = useNotifications();
  const { setName, setJob, setSchool, setGradeLevel } = useSessionStore();
  const { data: schoolsData, isLoading: isLoadingSchools, error: schoolsError } = useSchools();
  
  const [formData, setFormData] = useState({
    name: '',
    job: '' as JobRole | '',
    school: '', // Will be populated from API
    gradeLevel: '', // Grade level for teachers
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  // Handle school loading errors only once
  if (schoolsError && !hasShownError) {
    showError('Failed to Load Schools', '');
    setHasShownError(true);
  }

  // Reset error flag when error is resolved
  if (!schoolsError && hasShownError) {
    setHasShownError(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.job || !formData.school) {
      showError('Validation Error', 'Please fill in all required fields before submitting.');
      return;
    }

    // Validate grade level for teachers
    if (formData.job === 'Teacher' && !formData.gradeLevel) {
      showError('Validation Error', 'Please select a grade level for the teacher.');
      return;
    }

    setIsLoading(true);

    // Find the selected school to get the ID
    const selectedSchool = schoolsData?.data?.schools?.find(school => school.name === formData.school);
    
    // Save to session store
    setName(formData.name);
    setJob(formData.job as JobRole);
    setSchool(formData.school, selectedSchool?.id || '');
    
    // Save grade level for teachers
    if (formData.job === 'Teacher') {
      setGradeLevel(formData.gradeLevel);
    }

    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Show success notification
    showSuccess('Login Successful', `Welcome ${formData.name}!`);

    // Route based on job role
    if (formData.job === 'Teacher') {
      router.push('/dashboard');
    } else if (formData.job === 'HeadMistress') {
      router.push('/onboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src={homepageSvg}
              alt='HomepageImage'
              width={250}
              height={250}
              className="mx-auto"
            />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
            {/* Welcome to SchoolPilot */}
            Athena
          </h2>
          <p className="text-center text-sm text-gray-600">
            Automated Student Grading System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Enter your name please"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 h-12 px-4"
              />
            </div>

            <div>
              <Label htmlFor="job">Job Role</Label>
              <Select
                value={formData.job}
                onValueChange={(value: JobRole) => setFormData({ ...formData, job: value, gradeLevel: '' })}
              >
                <SelectTrigger className="mt-2 w-full !h-12 px-4" style={{ minHeight: '48px', height: '48px' }}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HeadMistress">Head Mistress</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grade Level Selection - Only show for Teachers */}
            {formData.job === 'Teacher' && (
              <div>
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Select
                  value={formData.gradeLevel}
                  onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}
                >
                  <SelectTrigger className="mt-2 w-full !h-12 px-4" style={{ minHeight: '48px', height: '48px' }}>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic_1">Primary 1</SelectItem>
                    <SelectItem value="Basic_2">Primary 2</SelectItem>
                    <SelectItem value="Basic_3">Primary 3</SelectItem>
                    <SelectItem value="Basic_4">Primary 4</SelectItem>
                    <SelectItem value="Basic_5">Primary 5</SelectItem>
                    <SelectItem value="Basic_6">Primary 6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="school">School</Label>
              <Select
                value={formData.school}
                onValueChange={(value) => setFormData({ ...formData, school: value })}
                disabled={isLoadingSchools}
              >
                <SelectTrigger className="mt-2 w-full !h-12 px-4" style={{ minHeight: '48px', height: '48px' }}>
                  <SelectValue placeholder={
                    isLoadingSchools 
                      ? "Loading schools..." 
                      : schoolsError 
                      ? "Failed to load schools - Please refresh"
                      : "Select school"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {schoolsData?.data?.schools?.map((school) => (
                    <SelectItem key={school.id} value={school.name}>
                      {school.name}
                    </SelectItem>
                  ))}
                  {(!schoolsData?.data?.schools || schoolsData.data.schools.length === 0) && !isLoadingSchools && (
                    <SelectItem value="no-schools" disabled>
                      No schools available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center h-12 py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}