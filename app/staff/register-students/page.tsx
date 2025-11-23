'use client';

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
import { X, Plus } from 'lucide-react';
import { useStudentForm, useCreateStudentsBatch } from '@/hooks/use-students';
import { useSessionStore } from '@/hooks/use-store';
import { useActiveTermBySchool } from '@/hooks/use-terms';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

function RegisterStudentsContent() {
  const { schoolId } = useSessionStore();
  const {
    students,
    newStudent,
    addStudent,
    removeStudent,
    clearStudents,
    updateNewStudent,
    getClassLevelLabel,
    getStudentsForSubmission,
    classLevels
  } = useStudentForm();

  const createStudentsBatch = useCreateStudentsBatch();

  const handleAddStudent = () => {
    const success = addStudent();
    if (!success) {
      alert('Please fill in all required student fields');
    }
  };

  const handleRegisterStudents = () => {
    if (students.length === 0) {
      alert('Please add at least one student before registering');
      return;
    }

    createStudentsBatch.mutate(
      { students: getStudentsForSubmission(), schoolId: schoolId || '' },
      {
        onSuccess: () => {
          setTimeout(() => {
            clearStudents();
          }, 2000);
        },
        onError: (error) => {
          console.error('Registration error:', error);
          alert('Failed to register students. Please try again.');
        }
      }
    );
  };

  const getButtonText = () => {
    if (createStudentsBatch.isPending) return 'Registering Students...';
    if (createStudentsBatch.isSuccess) return 'Students Registered ✓';
    return `Register ${students.length} Student${students.length !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Registration</h2>
        <p className="text-gray-600">Add and register students for your class</p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Student Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Student</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    value={newStudent.firstName}
                    onChange={(e) => updateNewStudent('firstName', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    value={newStudent.lastName}
                    onChange={(e) => updateNewStudent('lastName', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newStudent.dateOfBirth}
                    onChange={(e) => updateNewStudent('dateOfBirth', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={newStudent.gender}
                    onValueChange={(value: 'MALE' | 'FEMALE') => updateNewStudent('gender', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="classLevel">Class Level *</Label>
                <Select
                  value={newStudent.classLevel}
                  onValueChange={(value) => updateNewStudent('classLevel', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select class level" />
                  </SelectTrigger>
                  <SelectContent>
                    {classLevels.map((classLevel) => (
                      <SelectItem key={classLevel.value} value={classLevel.value}>
                        {classLevel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Guardian Information (Optional)</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input
                      id="guardianName"
                      placeholder="Enter guardian name"
                      value={newStudent.guardianName || ''}
                      onChange={(e) => updateNewStudent('guardianName', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianPhone">Guardian Phone</Label>
                    <Input
                      id="guardianPhone"
                      placeholder="+234-xxx-xxx-xxxx"
                      value={newStudent.guardianPhone || ''}
                      onChange={(e) => updateNewStudent('guardianPhone', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianEmail">Guardian Email</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      placeholder="guardian@example.com"
                      value={newStudent.guardianEmail || ''}
                      onChange={(e) => updateNewStudent('guardianEmail', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAddStudent}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student to List
              </Button>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Students to Register ({students.length})
            </h2>
            
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No students added yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getClassLevelLabel(student.classLevel)} • {student.gender} • {student.dateOfBirth}
                      </p>
                        {student.guardianName && (
                          <p className="text-sm text-gray-500">
                            Guardian: {student.guardianName}
                          </p>
                        )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeStudent(student.id)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {students.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <Button
                  onClick={handleRegisterStudents}
                  disabled={createStudentsBatch.isPending}
                  className={`w-full py-3 ${createStudentsBatch.isSuccess 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getButtonText()}
                </Button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

export default function RegisterStudents() {
  const { data: activeTermData } = useActiveTermBySchool();
  
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "280px",
        "--header-height": "48px",
      } as React.CSSProperties}
    >
      <AppSidebar 
        variant="inset" 
        activeItem="students"
        activeTermData={activeTermData}
      />
      <SidebarInset className="overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden max-w-full">
          <div className="flex flex-1 flex-col gap-2 p-4 lg:p-6 overflow-hidden max-w-full">
            <div className="overflow-auto max-w-full">
              <RegisterStudentsContent />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}