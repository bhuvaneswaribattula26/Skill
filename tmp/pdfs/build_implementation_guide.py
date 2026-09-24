from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfbase.pdfmetrics import stringWidth

OUT = r"C:\everything\Skill swap-campus\output\pdf\SkillSwap_Campus_Implementation_Guide.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=28, leading=34, textColor=colors.HexColor('#312e81'), alignment=TA_CENTER, spaceAfter=14))
styles.add(ParagraphStyle(name='CoverSub', parent=styles['BodyText'], fontSize=12, leading=18, textColor=colors.HexColor('#475569'), alignment=TA_CENTER))
styles.add(ParagraphStyle(name='H1x', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=19, leading=24, textColor=colors.HexColor('#312e81'), spaceBefore=8, spaceAfter=10))
styles.add(ParagraphStyle(name='H2x', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=17, textColor=colors.HexColor('#4f46e5'), spaceBefore=10, spaceAfter=5))
styles.add(ParagraphStyle(name='Bodyx', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.4, leading=14, textColor=colors.HexColor('#26324a'), spaceAfter=6))
styles.add(ParagraphStyle(name='Smallx', parent=styles['BodyText'], fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#475569')))
styles.add(ParagraphStyle(name='TableHeader', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white))
styles.add(ParagraphStyle(name='CodeX', parent=styles['BodyText'], fontName='Courier', fontSize=7.7, leading=11, leftIndent=8, rightIndent=8, backColor=colors.HexColor('#f1f5f9'), borderPadding=7, textColor=colors.HexColor('#1e293b'), spaceBefore=4, spaceAfter=8))

def p(text, style='Bodyx'):
    return Paragraph(text, styles[style])

def table(rows, widths):
    rows = list(rows)
    rows[0] = [Paragraph(cell.getPlainText() if isinstance(cell, Paragraph) else str(cell), styles['TableHeader']) for cell in rows[0]]
    t = Table(rows, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#312e81')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('LEADING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#e2e8f0'))
    canvas.line(1.7*cm, 1.45*cm, A4[0]-1.7*cm, 1.45*cm)
    canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.setFont('Helvetica', 8)
    canvas.drawString(1.7*cm, 0.95*cm, 'SkillSwap Campus - Implementation Guide')
    canvas.drawRightString(A4[0]-1.7*cm, 0.95*cm, f'Page {doc.page}')
    canvas.restoreState()

story = []
story += [Spacer(1, 3.2*cm), p('SkillSwap Campus', 'CoverTitle'), p('Implementation Guide and Project Map', 'CoverSub'), Spacer(1, .8*cm)]
cover_rows = [[p('<b>Purpose</b>', 'Smallx'), p('A simple reference for understanding, running, extending, and deploying the full-stack project.', 'Smallx')],
              [p('<b>Architecture</b>', 'Smallx'), p('Vanilla JavaScript frontend + Express/TypeScript backend + Prisma/PostgreSQL.', 'Smallx')],
              [p('<b>Current integrations</b>', 'Smallx'), p('Supabase PostgreSQL, JWT authentication, and YouTube Data API course search.', 'Smallx')]]
story += [table(cover_rows, [3.2*cm, 12.6*cm]), Spacer(1, 1.3*cm), p('Read this document in order for setup and deployment, or use the section headings as a project reference.', 'CoverSub'), PageBreak()]

story += [p('1. What the project does', 'H1x'),
          p('SkillSwap Campus is a peer learning platform for college students. A student creates an account, lists skills they can teach and learn, discovers other registered members, sends a swap request, schedules a learning session, exchanges messages, and finds free video courses.', 'Bodyx'),
          p('User journey', 'H2x'),
          table([[p('Step','Smallx'), p('Student action','Smallx'), p('System result','Smallx')],
                 [p('1','Smallx'), p('Sign up / log in','Smallx'), p('Backend issues access and refresh JWT tokens.','Smallx')],
                 [p('2','Smallx'), p('Complete profile and skills','Smallx'), p('Profile and teaching/learning skills are stored in PostgreSQL.','Smallx')],
                 [p('3','Smallx'), p('Explore people and matches','Smallx'), p('Real database members are shown; match scoring ranks complementary skills.','Smallx')],
                 [p('4','Smallx'), p('Send or accept a request','Smallx'), p('A SwapRequest is created and moves through requested, accepted, cancelled, or completed states.','Smallx')],
                 [p('5','Smallx'), p('Message and complete session','Smallx'), p('Messages are attached to the swap; completed sessions issue credits.','Smallx')],
                 [p('6','Smallx'), p('Use Courses','Smallx'), p('The backend searches YouTube and returns safe course metadata without exposing the API key.','Smallx')]], [1.2*cm, 6.1*cm, 8.5*cm]),
          p('What is real versus demo', 'H2x'), p('Authentication, profiles, skills, swap requests, sessions, messages, matching, credits, and course search use the backend/database. Homepage cards and some community content are visual demo content. Community posts created in the current browser are stored in localStorage for local demonstration.', 'Bodyx'), PageBreak()]

story += [p('2. Project structure', 'H1x'),
          table([[p('Location','Smallx'), p('Role','Smallx')],
                 [p('index.html','Smallx'), p('Page shell, header, footer, and script/style loading.','Smallx')],
                 [p('style.css','Smallx'), p('Responsive visual design and reusable UI classes.','Smallx')],
                 [p('script.js','Smallx'), p('Hash router, page rendering, forms, modals, interactions, and API calls.','Smallx')],
                 [p('api.js','Smallx'), p('Frontend API client, token storage, refresh logic, and authenticated requests.','Smallx')],
                 [p('data.js','Smallx'), p('Public/demo student and community data.','Smallx')],
                 [p('backend/src/index.ts','Smallx'), p('Express server, API routes, health endpoint, and static frontend hosting.','Smallx')],
                 [p('backend/src/routes','Smallx'), p('Auth, users, skills, swaps, sessions, messages, matches, credits, reviews, and courses endpoints.','Smallx')],
                 [p('backend/prisma/schema.prisma','Smallx'), p('PostgreSQL database models and relations.','Smallx')],
                 [p('backend/prisma/seed.ts','Smallx'), p('Optional verified demo members for local swap testing.','Smallx')]], [5.5*cm, 10.3*cm]),
          p('How requests move through the app', 'H2x'), p('Browser page -> api.js -> Express route -> middleware (JWT/validation) -> Prisma -> Supabase PostgreSQL -> JSON response -> UI refresh. Courses follow the same path, but the backend additionally calls the YouTube Data API with the private server key.', 'Bodyx'),
          p('Important design decision', 'H2x'), p('The frontend and API are served by one Express deployment. This avoids cross-origin frontend configuration in production: the page uses relative /api/v1 URLs, so the same domain serves both UI and backend.', 'Bodyx'), PageBreak()]

story += [p('3. Database and backend guide', 'H1x'),
          p('Main database models', 'H2x'),
          table([[p('Model','Smallx'), p('Why it exists','Smallx')],
                 [p('User','Smallx'), p('Account details, verification status, profile, and JWT ownership.','Smallx')],
                 [p('Skill','Smallx'), p('Reusable named skill with a category.','Smallx')],
                 [p('UserSkillTeach / UserSkillLearn','Smallx'), p('Many-to-many mapping between a student and the skills they teach/learn.','Smallx')],
                 [p('SwapRequest','Smallx'), p('A request between two users, with a status and optional primary skill.','Smallx')],
                 [p('Session','Smallx'), p('Scheduled meeting attached to an accepted swap request.','Smallx')],
                 [p('Message','Smallx'), p('Conversation messages belonging to an accepted/scheduled/completed swap.','Smallx')],
                 [p('CreditTransaction','Smallx'), p('Immutable ledger entries, issued when a session is completed.','Smallx')],
                 [p('Review / Notification / RefreshToken','Smallx'), p('Feedback, user alerts, and secure refresh-session tracking.','Smallx')]], [5.6*cm, 10.2*cm]),
          p('Important API groups', 'H2x'),
          table([[p('Route group','Smallx'), p('Examples','Smallx')],
                 [p('/api/health','Smallx'), p('Health check used locally and by Render.','Smallx')],
                 [p('/api/v1/auth','Smallx'), p('register, login, refresh, verify-email, logout.','Smallx')],
                 [p('/api/v1/users','Smallx'), p('current profile, member listing, profile update, skills.','Smallx')],
                 [p('/api/v1/swaps and /sessions','Smallx'), p('create/accept/decline/cancel swaps; schedule or complete sessions.','Smallx')],
                 [p('/api/v1/messages','Smallx'), p('read/send messages for a valid swap.','Smallx')],
                 [p('/api/v1/courses','Smallx'), p('server-side YouTube search: /courses?q=Python.','Smallx')]], [5.6*cm, 10.2*cm]), PageBreak()]

story += [p('4. Local setup and daily development', 'H1x'),
          p('Prerequisites', 'H2x'), p('Install Node.js 20+ and create a Supabase PostgreSQL project (or use another PostgreSQL database). The backend package file contains the required project dependencies.', 'Bodyx'),
          p('Environment setup', 'H2x'), p('Copy backend/.env.example to backend/.env. Keep .env only on your computer or deployment provider. It is excluded from Git by .gitignore.', 'Bodyx'),
          p('Core variables', 'H2x'),
          table([[p('Variable','Smallx'), p('Purpose','Smallx')],
                 [p('DATABASE_URL','Smallx'), p('Runtime PostgreSQL connection.','Smallx')],
                 [p('DIRECT_URL','Smallx'), p('Direct/session PostgreSQL URL used by Prisma tooling.','Smallx')],
                 [p('JWT_ACCESS_SECRET / JWT_REFRESH_SECRET','Smallx'), p('Different long random values used to sign tokens.','Smallx')],
                 [p('YOUTUBE_API_KEY','Smallx'), p('Restricted YouTube Data API v3 key, used only by backend courses route.','Smallx')],
                 [p('FRONTEND_URL','Smallx'), p('Public URL used for links in emails; localhost locally, Render URL in production.','Smallx')]], [6.2*cm, 9.6*cm]),
          p('Run commands', 'H2x'),
          p('cd "C:\\everything\\Skill swap-campus\\backend"\nnpm install\nnpx prisma db push\nnpm run db:seed\nnpm run build\nnpm start', 'CodeX'),
          p('Open http://localhost:4000. Keep the terminal open. Use Ctrl + C to stop the server. If port 4000 is occupied, stop the older Node process before starting again.', 'Bodyx'), PageBreak()]

story += [p('5. Testing checklist', 'H1x'),
          p('Use two accounts when testing swaps. A user cannot send a swap request to themselves, and a real swap requires another registered database user.', 'Bodyx'),
          table([[p('Area','Smallx'), p('Check','Smallx'), p('Expected result','Smallx')],
                 [p('Server','Smallx'), p('Open /api/health','Smallx'), p('Returns status ok JSON.','Smallx')],
                 [p('Auth','Smallx'), p('Create account and log in','Smallx'), p('Tokens stored locally; header shows Profile and Log out.','Smallx')],
                 [p('Profile','Smallx'), p('Change name, college, bio','Smallx'), p('Saved values remain after page refresh.','Smallx')],
                 [p('Skills','Smallx'), p('Add teach and learn skills','Smallx'), p('Skills appear in My Skills and profile.','Smallx')],
                 [p('Explore','Smallx'), p('Search/filter other users','Smallx'), p('Database members appear after sign-in.','Smallx')],
                 [p('Swaps','Smallx'), p('Send, accept/decline/cancel request','Smallx'), p('Request state updates in Requests.','Smallx')],
                 [p('Messages','Smallx'), p('Message after an accepted swap','Smallx'), p('Message persists under that swap.','Smallx')],
                 [p('Courses','Smallx'), p('Search Python or Figma','Smallx'), p('Course cards load from YouTube without exposing the key.','Smallx')]], [2.1*cm, 7.2*cm, 6.5*cm]),
          p('Troubleshooting', 'H2x'),
          table([[p('Symptom','Smallx'), p('First action','Smallx')],
                 [p('EADDRINUSE port 4000','Smallx'), p('An older server is running. Stop it in its terminal with Ctrl + C, then run npm start.','Smallx')],
                 [p('Database table does not exist','Smallx'), p('Confirm DATABASE_URL/DIRECT_URL and run npx prisma db push locally.','Smallx')],
                 [p('Logged out unexpectedly','Smallx'), p('Log in again after a restart; verify backend is available and JWT secrets did not change.','Smallx')],
                 [p('No swap members','Smallx'), p('Create a second account or run npm run db:seed for development demo members.','Smallx')],
                 [p('Courses unavailable','Smallx'), p('Check YOUTUBE_API_KEY exists server-side and is restricted to YouTube Data API v3.','Smallx')]], [5.1*cm, 10.7*cm]), PageBreak()]

story += [p('6. GitHub, deployment, and roadmap', 'H1x'),
          p('GitHub safety', 'H2x'), p('Commit source code, README.md, .env.example, package-lock.json, and Prisma schema. Never commit backend/.env, keys, database URLs with passwords, generated node_modules, or dist files.', 'Bodyx'),
          p('Render deployment', 'H2x'),
          table([[p('Render setting','Smallx'), p('Value','Smallx')],
                 [p('Root Directory','Smallx'), p('backend','Smallx')],
                 [p('Build Command','Smallx'), p('npm install --include=dev && npm run build','Smallx')],
                 [p('Start Command','Smallx'), p('npm start','Smallx')],
                 [p('Health Check Path','Smallx'), p('/api/health','Smallx')],
                 [p('Pre-deploy command','Smallx'), p('Leave empty for the current project.','Smallx')]], [5.3*cm, 10.5*cm]),
          p('Render variable checklist', 'H2x'), p('NODE_ENV=production; DATABASE_URL; DIRECT_URL; JWT_ACCESS_SECRET; JWT_REFRESH_SECRET; JWT_ACCESS_EXPIRES_IN=24h; JWT_REFRESH_EXPIRES_IN=7d; YOUTUBE_API_KEY; ALLOWED_EMAIL_DOMAINS; CORS_ORIGIN=*; FRONTEND_URL=your live Render URL; NODE_VERSION=22.13.1.', 'Bodyx'),
          p('Recommended next improvements', 'H2x'),
          table([[p('Priority','Smallx'), p('Improvement','Smallx'), p('Why','Smallx')],
                 [p('High','Smallx'), p('Create formal Prisma migrations and tests','Smallx'), p('Safer schema updates and repeatable quality checks.','Smallx')],
                 [p('High','Smallx'), p('Production email verification and password reset','Smallx'), p('Completes account lifecycle outside development mode.','Smallx')],
                 [p('Medium','Smallx'), p('Real-time Socket.IO chat','Smallx'), p('Improves messaging beyond REST refresh.','Smallx')],
                 [p('Medium','Smallx'), p('Course bookmarks and learning progress','Smallx'), p('Connects YouTube resources to each learner profile.','Smallx')],
                 [p('Medium','Smallx'), p('Admin moderation and reporting UI','Smallx'), p('Uses existing report models for safer community management.','Smallx')]], [2.3*cm, 6.2*cm, 7.3*cm]),
          Spacer(1, .5*cm), p('End of guide', 'CoverSub')]

doc = SimpleDocTemplate(OUT, pagesize=A4, rightMargin=1.7*cm, leftMargin=1.7*cm, topMargin=1.55*cm, bottomMargin=1.8*cm, title='SkillSwap Campus Implementation Guide')
doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(OUT)
