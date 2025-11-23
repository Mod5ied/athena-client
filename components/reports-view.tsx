'use client';

import React, { useEffect } from 'react';
import { useClassReport } from '@/hooks/use-reports';
import { useSessionStore } from '@/hooks/use-store';
import { useActiveTermBySchool } from '@/hooks/use-terms';
import { useNotifications } from '@/hooks/use-notifications';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileBarChart, Users, TrendingUp, TrendingDown } from 'lucide-react';

// Simple Card component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
    {children}
  </div>
);

// Simple Badge component
const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

// Grade levels available in the system
const GRADE_LEVELS = [
  { value: 'Basic_1', label: 'Basic 1' },
  { value: 'Basic_2', label: 'Basic 2' },
  { value: 'Basic_3', label: 'Basic 3' },
  { value: 'Basic_4', label: 'Basic 4' },
  { value: 'Basic_5', label: 'Basic 5' },
  { value: 'Basic_6', label: 'Basic 6' },
];

export function ReportsView() {
  const { showError, showSuccess } = useNotifications();
  const { termId, schoolId, gradeLevel, setTerm } = useSessionStore();
  
  // Fetch active term for the school
  const { 
    data: activeTermData, 
    error: termError 
  } = useActiveTermBySchool();
  
  // Check if it's the final week of the term
  const isFinalWeek = activeTermData?.data?.currentWeek === activeTermData?.data?.totalWeeks;
  
  // Update session store when active term is loaded
  useEffect(() => {
    if (activeTermData?.data && (!termId || termId !== activeTermData.data.id)) {
      setTerm(activeTermData.data.id, activeTermData.data.name);
    }
  }, [activeTermData, termId, setTerm]);

  // Fetch class report data
  const { 
    data: reportData, 
    isLoading: isLoadingReport,
    error: reportError 
  } = useClassReport(termId, gradeLevel, schoolId);

  // Handle errors
  useEffect(() => {
    if (termError) {
      showError('Error', 'Failed to load active term');
    }
  }, [termError, showError]);

  useEffect(() => {
    if (reportError) {
      showError('Error', 'Failed to load class report');
    }
  }, [reportError, showError]);

  // Get remarks badge style
  const getRemarksBadgeStyle = (remarks: string) => {
    switch (remarks) {
      case 'PASSED':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'FAILED':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'REPEAT':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Get position display with ordinal suffix
  const formatPosition = (position: string) => {
    return position;
  };

  // Format average with color coding
  const getAverageColor = (average: number) => {
    if (average >= 70) return 'text-green-600 font-semibold';
    if (average >= 60) return 'text-blue-600 font-semibold';
    if (average >= 40) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!reportData?.data) return;

    try {
      // Dynamically import jsPDF and html2canvas
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const gradeLabel = GRADE_LEVELS.find(level => level.value === reportData.data.class)?.label || reportData.data.class;
      
      // Get the table element
      const tableElement = document.querySelector('[data-pdf-table]') as HTMLElement;
      if (!tableElement) {
        showError('Error', 'Table not found for PDF generation');
        return;
      }

      // Create a temporary container with better styling for PDF
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 1200px;
        background: white;
        padding: 20px;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
        visibility: visible;
        opacity: 1;
        z-index: -1;
      `;

      // Clone the table element to avoid affecting the original
      const clonedTable = tableElement.cloneNode(true) as HTMLElement;
      
      // Apply inline styles to the cloned table
      clonedTable.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        background: white;
        font-size: 12px;
        border: 1px solid #ccc;
      `;

      // Apply styles to all cells
      const cells = clonedTable.querySelectorAll('th, td');
      cells.forEach((cell) => {
        (cell as HTMLElement).style.cssText = `
          border: 1px solid #ccc;
          padding: 6px 4px;
          text-align: center;
          background: white;
          color: black;
          font-size: 10px;
        `;
      });

      // Create header
      const header = document.createElement('div');
      header.style.cssText = `
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #e5e5e5;
        padding-bottom: 15px;
      `;
      header.innerHTML = `
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: black;">
          ${gradeLabel} - ${reportData.data.term.replace(/ \d{4}\/\d{4}$/, '')}
        </h1>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #666;">
          Session: ${reportData.data.session}
        </p>
      `;

      tempContainer.appendChild(header);
      tempContainer.appendChild(clonedTable);
      document.body.appendChild(tempContainer);

      // Configure html2canvas options with better color handling
      const canvas = await html2canvas(tempContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1200,
        height: tempContainer.scrollHeight,
        ignoreElements: (element) => {
          // Skip any elements that might have problematic CSS
          const tagName = element.tagName?.toLowerCase();
          return tagName === 'script' || tagName === 'style' || element.classList?.contains('lucide');
        },
        onclone: (clonedDoc) => {
          // Add a comprehensive style reset to avoid color parsing issues
          const styleElement = clonedDoc.createElement('style');
          styleElement.textContent = `
            * {
              color: #000000 !important;
              background-color: #ffffff !important;
              border-color: #cccccc !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              background-color: #ffffff !important;
            }
            th, td {
              border: 1px solid #cccccc !important;
              padding: 6px 4px !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              font-size: 10px !important;
            }
            th {
              background-color: #f5f5f5 !important;
              font-weight: bold !important;
            }
            .bg-green-100, .remarks-passed {
              background-color: #dcfce7 !important;
              color: #166534 !important;
            }
            .bg-red-100, .remarks-failed {
              background-color: #fecaca !important;
              color: #991b1b !important;
            }
            .bg-orange-100, .remarks-repeat {
              background-color: #fed7aa !important;
              color: #c2410c !important;
            }
            .bg-yellow-50 {
              background-color: #fefce8 !important;
            }
            .bg-blue-50 {
              background-color: #eff6ff !important;
            }
            .student-name {
              text-align: left !important;
              font-weight: bold !important;
            }
          `;
          clonedDoc.head.appendChild(styleElement);
          
          // Remove any existing stylesheets that might contain problematic colors
          const existingStyles = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
          existingStyles.forEach(style => {
            if (style.parentNode) {
              style.parentNode.removeChild(style);
            }
          });
        }
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const filename = `${gradeLabel}-${reportData.data.term.replace(/ /g, '_')}-Report.pdf`;
      pdf.save(filename);
      
      showSuccess('Success', 'Report downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      showError('Error', 'Failed to generate PDF report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Reports</h2>
        <p className="text-gray-600">Generate and view class performance reports</p>
      </div>



      {/* Class Statistics */}
      {reportData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.data.classStats.totalStudents}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">{reportData.data.classStats.passedStudents}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{reportData.data.classStats.failedStudents}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <FileBarChart className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Class Average</p>
                <p className={`text-2xl font-bold ${getAverageColor(reportData.data.classStats.classAverage)}`}>
                  {reportData.data.classStats.classAverage}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reports Table */}
      {gradeLevel && (
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {reportData?.data ? `${GRADE_LEVELS.find(level => level.value === reportData.data.class)?.label || reportData.data.class} - ${reportData.data.term.replace(/ \d{4}\/\d{4}$/, '')}` : 'Class Report'}
                </h3>
                <p className="text-sm text-gray-600">
                  {reportData?.data ? `Session: ${reportData.data.session}` : 'Loading class data...'}
                </p>
              </div>
              {reportData?.data && (
                <Button 
                  variant="outline" 
                  className={`flex items-center gap-2 ${
                    !isFinalWeek ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={isFinalWeek ? handleDownloadPDF : undefined}
                  disabled={!isFinalWeek}
                  title={!isFinalWeek ? `Reports available only in final week (Week ${activeTermData?.data?.totalWeeks || 'N/A'})` : 'Download class reports as PDF'}
                >
                  <Download className="h-4 w-4" />
                  Download Reports
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            {isLoadingReport ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading class report...</span>
              </div>
            ) : reportData?.data ? (
              <div className="overflow-x-auto max-w-full">
                <div className="min-w-max">
                  <Table data-pdf-table>
                  <TableHeader>
                    {/* Level 1 Header - Main Column Groups */}
                    <TableRow>
                      {/* Student Name Column */}
                      <TableHead className="font-semibold text-gray-900 min-w-[200px] border-r-2 border-gray-200 align-middle">
                        Student Name
                      </TableHead>
                      
                      {/* Subject Columns - Each subject spans 3 sub-columns */}
                      {reportData.data.subjects.map((subject) => (
                        <TableHead 
                          key={subject} 
                          colSpan={3} 
                          className="text-center font-semibold text-gray-900 border-r-2 border-gray-200 bg-gray-50"
                        >
                          {subject}
                        </TableHead>
                      ))}
                      
                      {/* Final Summary Columns */}
                      <TableHead className="text-center font-semibold text-gray-900 min-w-[100px] border-r border-gray-200 align-middle">
                        Term Total
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-900 min-w-[120px] border-r border-gray-200 align-middle">
                        Brought Forward
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-900 min-w-[100px] border-r border-gray-200 align-middle">
                        Cumulative
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-900 min-w-[80px] border-r border-gray-200 align-middle">
                        Average
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-900 min-w-[80px] border-r border-gray-200 align-middle">
                        Position
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-900 min-w-[100px] align-middle">
                        Remarks
                      </TableHead>
                    </TableRow>
                    
                    {/* Level 2 Header - Sub-columns for each subject */}
                    {/* <TableRow>
                      <TableHead className="border-r-2 border-gray-200"></TableHead>
                      
                      {reportData.data.subjects.map((subject) => (
                        <React.Fragment key={`sub-${subject}`}>
                          <TableHead className="text-center text-xs font-medium text-gray-600 py-2 border-r border-gray-100 bg-blue-50/50 min-w-[72px]">
                            Weekly
                          </TableHead>
                          <TableHead className="text-center text-xs font-medium text-gray-600 py-2 border-r border-gray-100 bg-green-50/50 min-w-[72px]">
                            Sum + Exam
                          </TableHead>
                          <TableHead className="text-center text-xs font-medium text-gray-600 py-2 border-r-2 border-gray-200 bg-purple-50/50 min-w-[72px]">
                            Total
                          </TableHead>
                        </React.Fragment>
                      ))}
                      
                      <TableHead className="border-r border-gray-200"></TableHead>
                      <TableHead className="border-r border-gray-200"></TableHead>
                      <TableHead className="border-r border-gray-200"></TableHead>
                      <TableHead className="border-r border-gray-200"></TableHead>
                      <TableHead className="border-r border-gray-200"></TableHead>
                      <TableHead></TableHead>
                    </TableRow> */}
                    
                  </TableHeader>
                  <TableBody>
                    {reportData.data.students.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        {/* Student Name */}
                        <TableCell className="font-medium text-gray-900 py-4 border-r-2 border-gray-200 student-name">
                          {student.name.toUpperCase()}
                        </TableCell>
                        
                        {/* Subject Sub-columns: Weekly, Sum of Summative & Exam, Total for each subject */}
                        {reportData.data.subjects.map((subjectName) => {
                          const subjectGrade = student.grades[subjectName];
                          const weekly = subjectGrade?.weekly || 0;
                          const summative = subjectGrade?.summative || 0;
                          const exam = subjectGrade?.exam || 0;
                          const summativeAndExam = summative + exam;
                          const total = subjectGrade?.total || 0;
                          
                          return (
                            <React.Fragment key={subjectName}>
                              {/* Weekly Assessment Score */}
                              <TableCell className="text-center text-sm font-medium py-4 border-r border-gray-100 bg-blue-50/30 min-w-[72px]">
                                {weekly}
                              </TableCell>
                              
                              {/* Sum of Summative & Exam */}
                              <TableCell className="text-center text-sm font-medium py-4 border-r border-gray-100 bg-green-50/30 min-w-[72px]">
                                {summativeAndExam}
                              </TableCell>
                              
                              {/* Subject Total */}
                              <TableCell className="text-center text-sm font-medium py-4 border-r-2 border-gray-200 bg-purple-50/30 min-w-[72px]">
                                {total}
                              </TableCell>
                            </React.Fragment>
                          );
                        })}
                        
                        {/* Term Total */}
                        <TableCell className="text-center font-semibold text-gray-900 py-4 border-r border-gray-200 bg-yellow-50">
                          {student.termTotal}
                        </TableCell>
                        
                        {/* Brought Forward */}
                        <TableCell className="text-center font-medium text-gray-700 py-4 border-r border-gray-200">
                          {student.broughtForward}
                        </TableCell>
                        
                        {/* Cumulative */}
                        <TableCell className="text-center font-semibold text-gray-900 py-4 border-r border-gray-200 bg-blue-50">
                          {student.cumulative}
                        </TableCell>
                        
                        {/* Average */}
                        <TableCell className={`text-center font-semibold py-4 border-r border-gray-200 ${getAverageColor(student.average)}`}>
                          {student.average}
                        </TableCell>
                        
                        {/* Position */}
                        <TableCell className="text-center font-bold text-gray-900 py-4 border-r border-gray-200">
                          {formatPosition(student.position)}
                        </TableCell>
                        
                        {/* Remarks */}
                        <TableCell className={`text-center py-4 ${student.remarks === 'PASSED' ? 'remarks-passed' : student.remarks === 'FAILED' ? 'remarks-failed' : student.remarks === 'REPEAT' ? 'remarks-repeat' : ''}`}>
                          <Badge className={getRemarksBadgeStyle(student.remarks)}>
                            {student.remarks}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            ) : reportError ? (
              <div className="text-center py-12">
                <div className="text-red-400 text-lg mb-2">📊</div>
                <p className="text-red-600">Failed to load class report</p>
                <p className="text-sm text-gray-500 mt-1">Please try selecting a different class</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-gray-400 text-lg mb-2">📊</div>
                <p>No report data available</p>
                <p className="text-sm mt-1">Students may not have completed assessments yet</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {!gradeLevel && (
        <Card className="p-12 text-center bg-gray-50">
          <div className="text-gray-400 text-lg mb-2">📋</div>
          <p className="text-gray-600">No class selected in session</p>
        </Card>
      )}
    </div>
  );
}