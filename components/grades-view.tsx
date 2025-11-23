'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { 
  useStudentGrades, 
  useRecordAssessment,
  type StudentGradesResponse,
  type SubjectGrades,
  type StudentAssessment
} from '@/hooks/use-grading';
import { useStudentsForDropdown } from '@/hooks/use-students';
import { useActiveTermBySchool } from '@/hooks/use-terms';
import { useNotifications } from '@/hooks/use-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/hooks/use-store';

// Generate week numbers (1-12 for a typical term)
const TERM_WEEKS = Array.from({ length: 12 }, (_, i) => i + 1);

// Term subject type
interface TermSubject {
  name: string;
  gradeLevel: string[];
}

// Nigerian grading system constants
const NIGERIAN_GRADING_CONFIG = {
  MAX_POINTS: {
    WEEKLY: 5,
    SUMMATIVE: 20,
    EXAM: 20
  }
};

// Get assessment type and max points based on week
function getAssessmentInfo(week: number, totalWeeks: number = 12): {
  type: 'weekly' | 'summative' | 'exam' | 'invalid';
  maxPoints: number;
} {
  if (week === 7) {
    return { type: 'summative' as const, maxPoints: NIGERIAN_GRADING_CONFIG.MAX_POINTS.SUMMATIVE };
  } else if (week === totalWeeks) {
    return { type: 'exam' as const, maxPoints: NIGERIAN_GRADING_CONFIG.MAX_POINTS.EXAM };
  } else if ((week >= 2 && week <= 6) || (week >= 8 && week <= totalWeeks - 1)) {
    return { type: 'weekly' as const, maxPoints: NIGERIAN_GRADING_CONFIG.MAX_POINTS.WEEKLY };
  } else {
    return { type: 'invalid' as const, maxPoints: 0 };
  }
}



interface GradesCellProps {
  score?: number;
  maxPoints?: number;
  week: number;
  subjectId: string;
  studentId: string;
  isTermActive: boolean;
  currentWeek?: number;
  totalWeeks?: number;
  showWarning: (title: string, message: string) => void;
}

function GradesCell({ score, maxPoints, week, subjectId, studentId, isTermActive, currentWeek, totalWeeks = 12, showWarning }: GradesCellProps) {
  const { editingCell, setEditingCell, isTableEditable, termId } = useSessionStore();
  const [tempValue, setTempValue] = useState('');
  const recordAssessmentMutation = useRecordAssessment();
  const queryClient = useQueryClient();

  // Check if this cell is currently being edited
  const isEditing = editingCell?.week === week && editingCell?.subjectId === subjectId;

  // Check if this cell can be edited
  const assessmentInfo = getAssessmentInfo(week, totalWeeks);
  const isValidWeek = assessmentInfo.type !== 'invalid';
  const isCurrentOrPastWeek = !currentWeek || week <= currentWeek;
  const canEdit = isTermActive && isTableEditable && isValidWeek && isCurrentOrPastWeek;

  const handleCellClick = () => {
    if (!canEdit || isEditing) return;
    
    // Show specific warning messages
    if (!isValidWeek) {
      showWarning(
        "Week Not Available",
        `Week ${week} is not available for assessments. Use weeks 2-6 or 8-11 for weekly assessments, week 7 for summative tests, or week ${totalWeeks} for exams.`
      );
      return;
    } else if (!isCurrentOrPastWeek) {
      showWarning(
        "Future Week",
        `Cannot record assessments for week ${week}. The current week is ${currentWeek}. You can only record assessments for current and past weeks.`
      );
      return;
    }
    
    // Check if it's a mobile device (touch screen)
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile) {
      // Single click on mobile
      setTempValue(score?.toString() || '');
      setEditingCell({
        week,
        subjectId,
        currentValue: score || 0
      });
    }
  };

  const handleCellDoubleClick = () => {
    if (!canEdit || isEditing) return;
    
    setTempValue(score?.toString() || '');
    setEditingCell({
      week,
      subjectId,
      currentValue: score || 0
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty value
    if (value === '') {
      setTempValue(value);
      return;
    }
    
    // Only allow numbers
    if (!/^\d+$/.test(value)) {
      return;
    }
    
    const numericValue = parseInt(value);
    const totalWeeks = 12; // You can make this dynamic later
    const assessmentInfo = getAssessmentInfo(week, totalWeeks);
    const maxAllowed = assessmentInfo.maxPoints;
    
    // Check against Nigerian grading system limits
    if (maxAllowed === 0) {
      showWarning(
        'Invalid Week',
        `Week ${week} is not available for assessments. Use weeks 2-6 or 8-11 for weekly assessments, week 7 for summative tests, or week ${totalWeeks} for exams.`
      );
      return;
    }
    
    if (numericValue > maxAllowed) {
      let assessmentType = 'weekly assessment';
      if (assessmentInfo.type === 'summative') assessmentType = 'summative test';
      if (assessmentInfo.type === 'exam') assessmentType = 'exam';
      
      showWarning(
        'Invalid Score',
        `Maximum score for ${assessmentType} in Week ${week} is ${maxAllowed} points. You entered ${numericValue}.`
      );
      return;
    }
    
    setTempValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = () => {
    // Only save if value has actually changed
    const newScore = parseInt(tempValue);
    if (isNaN(newScore) || newScore === score) {
      setEditingCell(null);
      setTempValue('');
      return;
    }
    
    // Show that we're saving (optional - you can remove this if you prefer)
    console.log(`💾 Saving assessment: ${newScore} points for week ${week}...`);
    
    // Get assessment type for this week
    const totalWeeks = 12;
    const assessmentInfo = getAssessmentInfo(week, totalWeeks);
    
    if (assessmentInfo.type === 'invalid') {
      showWarning('Invalid Week', `Cannot save assessment for Week ${week}`);
      setEditingCell(null);
      setTempValue('');
      return;
    }
    
    // Get required data from session store
    const { termId } = useSessionStore.getState();
    
    if (!termId) {
      showWarning('Error', 'No active term found');
      setEditingCell(null);
      setTempValue('');
      return;
    }
    
    // Store current values for potential restoration
    const currentEditState = { week, subjectId, currentValue: score || 0 };
    const currentTempValue = tempValue;
    const originalScore = score;
    
    // Exit edit mode immediately for better UX
    setEditingCell(null);
    setTempValue('');
    
    // Simple optimistic update - just update the UI immediately
    if (queryClient) {
      const queryKey = ['student-grades', studentId, termId];
      
      queryClient.setQueryData(queryKey, (old: StudentGradesResponse | undefined) => {
        if (!old?.data?.subjects) return old;
        
        // Extract subject name from term-based subjectId (term_0_Mathematics -> Mathematics)
        const subjectName = subjectId.startsWith('term_') 
          ? subjectId.replace(/^term_\d+_/, '').replace(/_/g, ' ')
          : subjectId;
        
        const updatedData = { ...old };
        const subjects = updatedData.data.subjects.map((subject: SubjectGrades) => {
          // Match by subject name instead of subjectId
          if (subject.subjectName.toLowerCase() === subjectName.toLowerCase()) {
            const assessments = [...subject.assessments];
            const existingIndex = assessments.findIndex((a: StudentAssessment) => a.week === week);
            
            if (existingIndex >= 0) {
              // Update existing assessment
              assessments[existingIndex] = { 
                ...assessments[existingIndex], 
                score: newScore 
              };
            } else {
              // Add new assessment
              assessments.push({
                week,
                maxPoints: assessmentInfo.maxPoints,
                score: newScore
              });
            }
            
            return { ...subject, assessments };
          }
          return subject;
        });
        
        return { 
          ...updatedData, 
          data: { ...updatedData.data, subjects }
        };
      });
    }
    
    // Record the assessment - pass the term-based subjectId to backend
    // Backend will resolve it to the actual subject ID
    recordAssessmentMutation.mutate({
      studentId,
      subjectId, // This is the term-based ID like "term_0_Mathematics"
      termId,
      assessmentType: assessmentInfo.type as 'weekly' | 'summative' | 'exam',
      score: newScore,
      week: week // Always pass week for all assessment types including exams
    }, {
      onSuccess: () => {
        // Don't invalidate immediately - the delayed invalidation in useRecordAssessment will handle this
        // This allows the optimistic update to persist until the database is properly updated
        console.log('Assessment recorded successfully, waiting for delayed refresh...');
      },
      onError: (error) => {
        // Revert optimistic update and re-enter edit mode
        if (queryClient) {
          queryClient.setQueryData(['student-grades', studentId, termId], (old: StudentGradesResponse | undefined) => {
            if (!old?.data?.subjects) return old;
            
            // Extract subject name from term-based subjectId for error revert
            const subjectName = subjectId.startsWith('term_') 
              ? subjectId.replace(/^term_\d+_/, '').replace(/_/g, ' ')
              : subjectId;
            
            const revertedData = { ...old };
            const subjects = revertedData.data.subjects.map((subject: SubjectGrades) => {
              // Match by subject name for error revert too
              if (subject.subjectName.toLowerCase() === subjectName.toLowerCase()) {
                const assessments = [...subject.assessments];
                const existingIndex = assessments.findIndex((a: StudentAssessment) => a.week === week);
                
                if (existingIndex >= 0) {
                  if (originalScore !== undefined) {
                    // Restore original score
                    assessments[existingIndex] = {
                      ...assessments[existingIndex],
                      score: originalScore
                    };
                  } else {
                    // Remove the assessment if it was newly created
                    assessments.splice(existingIndex, 1);
                  }
                }
                
                return { ...subject, assessments };
              }
              return subject;
            });
            
            // Remove optimistic update metadata
            const { _optimisticUpdates, ...cleanData } = revertedData as any;
            return { ...cleanData, data: { ...cleanData.data, subjects } };
          });
        }
        
        // Re-enter edit mode with the failed value
        setEditingCell(currentEditState);
        setTempValue(currentTempValue);
        showWarning('Save Failed', error.message || 'Failed to save assessment');
      }
    });
  };

  const handleCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const handleBlur = () => {
    // Auto-save on blur with immediate edit mode exit
    handleSave();
  };

  // Don't return early for undefined scores if the cell should be editable
  if ((score === undefined || maxPoints === undefined) && !canEdit) {
    return <TableCell className="text-center text-gray-400 py-5 h-14">-</TableCell>;
  }
  
  // Use default max points from assessment info if maxPoints is undefined
  const effectiveMaxPoints = maxPoints || assessmentInfo.maxPoints;

  // Calculate percentage for color coding (only if score exists)
  let bgColor = '';
  if (score !== undefined && effectiveMaxPoints > 0) {
    const percentage = (score / effectiveMaxPoints) * 100;
    // Normal color coding
    if (percentage >= 70) bgColor = 'bg-green-50 text-green-800';
    else if (percentage >= 60) bgColor = 'bg-blue-50 text-blue-800';
    else if (percentage >= 40) bgColor = 'bg-yellow-50 text-yellow-800';
    else bgColor = 'bg-red-50 text-red-800';
  } else if (canEdit) {
    // Editable cell with no score yet - light gray
    bgColor = 'bg-gray-50 text-gray-600';
  }

  return (
    <TableCell 
      className={`text-center font-medium py-5 h-14 ${bgColor} ${
        canEdit ? 'cursor-pointer hover:bg-opacity-80' : ''
      }`}
      onClick={handleCellClick}
      onDoubleClick={handleCellDoubleClick}
    >
      {isEditing ? (
        <div className="flex justify-center items-center">
          <Input
            value={tempValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-16 h-8 text-center border-0 bg-white shadow-sm"
            style={{
              outline: '2px solid rgb(59 130 246)',
              outlineOffset: '0px'
            }}
            autoFocus
            maxLength={3}
          />
        </div>
      ) : (
        <div className="flex justify-center items-center"
          style={{
            outline: '2px solid transparent',
            outlineOffset: '0px'
          }}
        >
          {score !== undefined ? score : (canEdit ? '-' : '-')}
        </div>
      )}
    </TableCell>
  );}

export function GradesView() {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const { showError, showWarning } = useNotifications();
  const { termId, termName, setTerm, setTableEditable } = useSessionStore();
  
  // Fetch active term for the school
  const { 
    data: activeTermData, 
    isLoading: isLoadingTerm,
    error: termError 
  } = useActiveTermBySchool();
  
  // Update session store when active term is loaded
  useEffect(() => {
    if (activeTermData?.data && (!termId || termId !== activeTermData.data.id)) {
      setTerm(activeTermData.data.id, activeTermData.data.name);
    }
  }, [activeTermData, termId, setTerm]);

  // Update table editability based on term status
  useEffect(() => {
    if (activeTermData?.data) {
      setTableEditable(activeTermData.data.isActive !== false);
    }
  }, [activeTermData, setTableEditable]);
  
  const { 
    data: studentsData, 
    isLoading: isLoadingStudents,
    error: studentsError 
  } = useStudentsForDropdown();
  
  const { 
    data: gradesData, 
    isLoading: isLoadingGrades,
    error: gradesError 
  } = useStudentGrades(selectedStudent, termId);

  // Handle errors with useEffect to prevent render issues
  useEffect(() => {
    if (termError) {
      showError('Error', 'Failed to load active term');
    }
  }, [termError, showError]);

  useEffect(() => {
    if (studentsError) {
      showError('Error', 'Failed to load students');
    }
  }, [studentsError, showError]);

  useEffect(() => {
    if (gradesError) {
      showError('Error', 'Failed to load student grades');
    }
  }, [gradesError, showError]);
  
  // Helper function to format student name in uppercase
  const formatStudentName = (name: string) => {
    return name.toUpperCase();
  };

  // Create a matrix for easy table rendering
  const createGradesMatrix = () => {
    // Get subjects from active term data - this ensures we always show all subjects
    // even when student has no assessments yet
    const termSubjects: TermSubject[] = activeTermData?.data?.subjects || [];
    
    if (termSubjects.length === 0) return {};
    
    const matrix: Record<number, Record<string, { score?: number; maxPoints: number }>> = {};
    
    // Initialize matrix with default values for all weeks and subjects from term
    TERM_WEEKS.forEach(week => {
      matrix[week] = {};
      const assessmentInfo = getAssessmentInfo(week);
      
      // Initialize all term subjects for this week with default max points
      termSubjects.forEach((termSubject, index) => {
        // Create a consistent subject ID from name and index for term subjects
        const subjectId = `term_${index}_${termSubject.name.replace(/\s+/g, '_')}`;
        matrix[week][subjectId] = {
          score: undefined, // No score initially
          maxPoints: assessmentInfo.maxPoints
        };
      });
    });
    
    // Fill matrix with actual assessment data if available
    if (gradesData?.data?.subjects) {
      gradesData.data.subjects.forEach(subject => {
        subject.assessments.forEach(assessment => {
          if (matrix[assessment.week]) {
            // Try to match by subject name first
            const termSubjectIndex = termSubjects.findIndex(ts => 
              ts.name.toLowerCase() === subject.subjectName.toLowerCase()
            );
            
            if (termSubjectIndex !== -1) {
              const subjectKey = `term_${termSubjectIndex}_${termSubjects[termSubjectIndex].name.replace(/\s+/g, '_')}`;
              if (matrix[assessment.week][subjectKey]) {
                matrix[assessment.week][subjectKey] = {
                  score: assessment.score,
                  maxPoints: assessment.maxPoints
                };
              }
            }
          }
        });
      });
    }
    
    return matrix;
  };

  const gradesMatrix = createGradesMatrix();
  // Use subjects from active term data to ensure headers show even with no assessments
  const subjects: TermSubject[] = activeTermData?.data?.subjects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Grades</h2>
        <p className="text-gray-600">See and track each student&#39;s performance in all subjects</p>
      </div>

      {/* Student Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 min-w-0">
            <Label htmlFor="student-select" className="text-sm font-medium text-gray-700">
              Select Student
            </Label>
            <Select
              value={selectedStudent}
              onValueChange={setSelectedStudent}
              disabled={isLoadingStudents || isLoadingTerm || !termId}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={
                  isLoadingTerm 
                    ? "Loading term..." 
                    : isLoadingStudents 
                    ? "Loading students..." 
                    : !termId
                    ? "No active term found"
                    : "Choose a student to view grades"
                } />
              </SelectTrigger>
              <SelectContent>
                {studentsData?.data?.students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {formatStudentName(student.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedStudent && gradesData?.data && (
            <div className="text-sm text-gray-600">
              <div className="font-medium">{formatStudentName(gradesData.data.studentName || '')}</div>
              <div>{termName || gradesData.data.termName}</div>
            </div>
          )}
        </div>
      </div>

      {/* Grades Table */}
      {selectedStudent && (
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoadingGrades ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading grades...</span>
            </div>
          ) : gradesData?.data ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 bg-gray-50 font-semibold py-5 h-14">Week</TableHead>
                    {subjects.map((subject, index) => (
                      <TableHead 
                        key={`term_${index}_${subject.name.replace(/\s+/g, '_')}`} 
                        className="text-center bg-gray-50 font-semibold min-w-32 py-5 h-14"
                      >
                        {subject.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TERM_WEEKS.map(week => (
                    <TableRow key={week}>
                      <TableCell className="font-medium bg-gray-50 py-5 h-14">
                        Week {week}
                      </TableCell>
                      {subjects.map((subject, index) => {
                        const subjectId = `term_${index}_${subject.name.replace(/\s+/g, '_')}`;
                        const assessment = gradesMatrix[week]?.[subjectId];
                        return (
                          <GradesCell
                            key={`${week}-${subjectId}`}
                            score={assessment?.score}
                            maxPoints={assessment?.maxPoints}
                            week={week}
                            subjectId={subjectId}
                            studentId={selectedStudent}
                            isTermActive={activeTermData?.data?.isActive !== false}
                            currentWeek={activeTermData?.data?.currentWeek}
                            totalWeeks={activeTermData?.data?.totalWeeks || 12}
                            showWarning={showWarning}
                          />
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No grades found for this student</p>
            </div>
          )}
        </div>
      )}

      {!selectedStudent && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <p className="text-gray-600">Select a student above to view their grades</p>
        </div>
      )}
    </div>
  );
}