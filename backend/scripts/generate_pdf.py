import sys, json, os, tempfile, datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.units import inch
import re

NAVY = colors.HexColor('#1F3A5B')
LIGHT_BLUE = colors.HexColor('#EBF2FF')
GRAY = colors.HexColor('#6B7280')

DEPARTMENT_ACRONYMS = {
    'Marine Engineering': 'BSME',
    'Marine Transportation': 'BSMT',
    'Criminology': 'BSCRIM',
    'Tourism Management': 'BSTM',
    'Technical-Vocational Teacher Education': 'BTVTED',
    'Early Childhood Education': 'EDUC',
    'Information System': 'BSIS',
    'Entrepreneurship': 'BSE',
    'Management Accounting': 'BSMA',
    'Nursing': 'BSN',
    'Humanities and Social Sciences': 'HUMSS',
    'Accountancy, Business and Management': 'ABM',
    'Science, Technology, Engineering and Mathematics': 'STEM',
    'General Academic Strand': 'GAS',
    'Other': 'OTHER',
}

def to_acronym(name):
    if not name or not isinstance(name, str):
        return 'N/A'
    # Extract acronym from (ACRONYM) pattern at the end
    match = re.search(r'\(([A-Z]{2,})\)\s*$', name)
    if match:
        return match.group(1)
    # Precise match
    if name in DEPARTMENT_ACRONYMS:
        return DEPARTMENT_ACRONYMS[name]
    # Match if starts with one of the official names
    for k, v in DEPARTMENT_ACRONYMS.items():
        if name.startswith(k):
            return v
    # Fallback: just return what was given, or its acronym if not blank
    return name if name != '' else 'N/A'

def add_header(canvas, doc, logo_path=None, semester_info="", year_info=""):
    canvas.saveState()
    page_width = doc.pagesize[0]
    logo_size = 70
    logo_x = 40
    logo_y = 770
    text_x = logo_x + logo_size + 15  # 125
    # Draw logo
    if logo_path and os.path.exists(logo_path):
        try:
            from reportlab.lib.utils import ImageReader
            img = ImageReader(logo_path)
            canvas.drawImage(img, logo_x, logo_y, width=logo_size, height=logo_size, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
    # Draw text block to the right of logo, vertically aligned
    canvas.setFont('Helvetica-Bold', 16)
    canvas.setFillColor(colors.HexColor('#175e86'))  # Blue color
    canvas.drawString(text_x, logo_y + 45, "Research and Publication Department")
    canvas.setFont('Helvetica-Bold', 13)
    canvas.setFillColor(colors.HexColor('#175e86'))  # Blue color
    canvas.drawString(text_x, logo_y + 30, "EXACT COLLEGES OF ASIA")
    canvas.setFont('Helvetica', 11)
    canvas.setFillColor(colors.HexColor('#175e86'))  # Blue color
    canvas.drawString(text_x, logo_y + 15, "Suclayin, Arayat, Pampanga")
    # Thin divider line under header
    canvas.setLineWidth(0.5)
    canvas.setStrokeColor(colors.HexColor('#CCCCCC'))
    canvas.line(40, 760, page_width - 40, 760)
    
    # Draw "Research Repository Analytics Report" title, centered
    canvas.setFont('Helvetica-Bold', 16)
    canvas.setFillColor(colors.HexColor('#175e86'))  # Blue color
    center_x = page_width / 2
    title_y = 710  # Position below the divider line (760 - 50)
    canvas.drawCentredString(center_x, title_y, "Research Repository Analytics Report")
    
    # Draw semester/year info, centered below the title
    filter_info = f"Semester: {semester_info}    Year: {year_info}"
    canvas.setFont('Helvetica', 13)
    canvas.setFillColor(GRAY)
    filter_y = title_y - 20  # 20 points below the title (y decreases downward in canvas)
    canvas.drawCentredString(center_x, filter_y, filter_info)
    
    canvas.restoreState()

def add_footer(canvas, doc, account_name="Admin"):
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(GRAY)
    canvas.drawString(40, 30, f"Exported by: {account_name}")
    canvas.drawRightString(A4[0] - 40, 30, f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
    canvas.restoreState()

def create_footer_elements(account_name="Admin"):
    """Create footer elements as document content (not canvas drawing)"""
    # Page width minus margins: A4 width (595) - left (40) - right (40) = 515
    page_content_width = A4[0] - 80
    footer_data = [
        [
            Paragraph(f"Exported by: {account_name}", ParagraphStyle('footer_left', parent=getSampleStyleSheet()['Normal'], fontSize=9, textColor=GRAY, alignment=0)),  # Left align
            Paragraph(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", ParagraphStyle('footer_right', parent=getSampleStyleSheet()['Normal'], fontSize=9, textColor=GRAY, alignment=2))  # Right align
        ]
    ]
    footer_tbl = Table(footer_data, colWidths=[page_content_width * 0.5, page_content_width * 0.5], hAlign='LEFT')
    footer_tbl.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,0), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,0), 20),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('LEFTPADDING', (0,0), (0,0), 0),
        ('RIGHTPADDING', (1,0), (1,0), 0),
    ]))
    return footer_tbl

def build_pdf(payload, logo_path=None):
    tmpdir = tempfile.gettempdir()
    out_path = os.path.join(tmpdir, 'Research_Statistics_Report.pdf')
    if not logo_path:
        base = os.path.dirname(__file__)
        frontend_logo = os.path.abspath(os.path.join(base, '..', '..', 'frontend', 'ecalogo.png'))
        if os.path.exists(frontend_logo):
            logo_path = frontend_logo
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=40, rightMargin=40, topMargin=180, bottomMargin=50
    )
    elements = []
    account_name = payload.get('account_name', 'Admin')
    # Get semester/year info for header (will be drawn on every page)
    sel_semester = (payload.get('semester') or '').strip() or 'All Semesters'
    sel_year = (str(payload.get('year')).strip() if payload.get('year') is not None else '') or 'All Years'
    # --- HEADER SPACER ---
    elements.append(Spacer(1, 30))
    # --- SUMMARY PAGE ---
    # Add "Summary" heading (title and semester/year now drawn on canvas for every page)
    summary_header = ParagraphStyle('summary_header', parent=styles['Heading1'], fontSize=16, spaceAfter=12, fontName='Helvetica-Bold', textColor=NAVY)
    elements.append(Paragraph('Summary', summary_header))
    s = payload.get('summary', {})
    # Handle multiple departments with same count
    top_dept = s.get('mostActiveDepartment', 'N/A')
    if isinstance(top_dept, str) and ',' in top_dept:
        # Split and convert each to acronym, then join
        dept_list = [to_acronym(d.strip()) for d in top_dept.split(',')]
        top_dept = ', '.join(dept_list)
    else:
        top_dept = to_acronym(top_dept)
    
    # Handle multiple advisers with same count
    top_adv = s.get('mostActiveAdviser', 'N/A')
    if isinstance(top_adv, str) and ',' in top_adv:
        # Split and convert each to uppercase, then join
        adv_list = [a.strip().upper() for a in top_adv.split(',')]
        top_adv = ', '.join(adv_list)
    elif isinstance(top_adv, str):
        top_adv = top_adv.upper()
    
    summary_data = [
        ['Metric', 'Value'],
        ['Total Research Uploaded', s.get('totalResearch', 0)],
        ['Top Department', top_dept],
        ['Top Adviser', top_adv]
    ]
    summary_tbl = Table(summary_data, colWidths=[220,220], hAlign='CENTER')
    summary_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 12),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('ALIGN', (0,1), (1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_BLUE, colors.whitesmoke]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14)
    ]))
    elements.append(summary_tbl)
    # Add footer after summary table
    elements.append(Spacer(1, 20))
    elements.append(create_footer_elements(account_name))
    elements.append(PageBreak())
    # --- UPLOADS BY DEPARTMENT PAGE ---
    elements.append(Spacer(1, 20))
    section_header = ParagraphStyle('section_header', parent=styles['Heading2'], fontSize=14, spaceBefore=12, spaceAfter=8, fontName='Helvetica-Bold', textColor=NAVY)
    elements.append(Paragraph('Uploads by Department', section_header))
    dept_data = [['Department', 'Count', 'Percentage']]
    for dept in payload.get('departments', []):
        percentage = dept.get('percentage', 0)
        try:
            percentage = float(percentage)
        except (ValueError, TypeError):
            percentage = 0.0
        dept_data.append([
            to_acronym(dept.get('name', 'Unknown')),
            dept.get('count', 0),
            f"{percentage:.2f}%"
        ])
    dept_tbl = Table(dept_data, colWidths=[210, 110, 110], hAlign='CENTER', repeatRows=1)
    dept_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 10),  # Reduced from 12 to 10
        ('FONTSIZE', (0,1), (-1,-1), 10),  # Data rows also 10
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('ALIGN', (0,1), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_BLUE, colors.whitesmoke]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('TOPPADDING', (0,0), (-1,-1), 6),  # Reduced from 10 to 6
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),  # Reduced from 10 to 6
        ('LEFTPADDING', (0,0), (-1,-1), 10),  # Reduced from 14 to 10
        ('RIGHTPADDING', (0,0), (-1,-1), 10)  # Reduced from 14 to 10
    ]))
    # Keep table and footer together on the same page
    footer_spacer = Spacer(1, 15)  # Reduced from 20 to 15
    footer_elem = create_footer_elements(account_name)
    elements.append(KeepTogether([dept_tbl, footer_spacer, footer_elem]))
    elements.append(PageBreak())
    # --- ADVISER SUBMISSIONS PAGE ---
    elements.append(Spacer(1, 30))
    elements.append(Paragraph('Research Submissions by Advisee Students', section_header))
    adviser_data = [['Adviser', 'Count', 'Percentage']]
    for adviser in payload.get('advisers', []):
        percentage = adviser.get('percentage', 0)
        try:
            percentage = float(percentage)
        except (ValueError, TypeError):
            percentage = 0.0
        adviser_data.append([
            adviser.get('name', 'Unknown').upper(),
            adviser.get('count', 0),
            f"{percentage:.2f}%"
        ])
    adviser_tbl = Table(adviser_data, colWidths=[210, 110, 110], hAlign='CENTER', repeatRows=1)
    adviser_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), NAVY),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 12),
            ('ALIGN', (0,0), (-1,0), 'CENTER'),
            ('ALIGN', (0,1), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_BLUE, colors.whitesmoke]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14)
    ]))
    elements.append(adviser_tbl)
    # Add footer after adviser table
    elements.append(Spacer(1, 20))
    elements.append(create_footer_elements(account_name))
    # Create callback with semester/year info for header
    def on_page(canvas, doc):
        add_header(canvas, doc, logo_path, sel_semester, sel_year)
        # Footer removed from canvas - now appears as content after each table
    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
    return out_path

def main():
    try:
        stdin_data = sys.stdin.read()
        payload = json.loads(stdin_data or '{}')
        out = build_pdf(payload)
        sys.stdout.write(out)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        raise

if __name__ == '__main__':
    main()
