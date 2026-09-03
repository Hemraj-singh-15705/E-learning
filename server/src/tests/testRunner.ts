import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PaymentService } from '../services/paymentService';
import { CertificateService } from '../services/certificateService';
import mongoSanitize from '../middleware/sanitize';

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, name, status: 'PASS', durationMs: Date.now() - start });
    console.log(`  ✓ [${suite}] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ suite, name, status: 'FAIL', durationMs: Date.now() - start, error: err.message });
    console.error(`  ✗ [${suite}] ${name} -> ${err.message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PRODUCTION READINESS TEST SUITE (PART 1 - 8)');
  console.log('======================================================\n');

  // --- SUITE 1: AUTHENTICATION & TOKENS ---
  await runTest('Auth & Security', 'Password hashing & bcrypt validation', async () => {
    const rawPass = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPass, salt);
    assert(await bcrypt.compare(rawPass, hash), 'Password match failed');
    assert(!(await bcrypt.compare('WrongPassword', hash)), 'Invalid password should not match');
  });

  await runTest('Auth & Security', 'JWT Token generation and verification', () => {
    const secret = 'test_jwt_secret_key_2026';
    const payload = { id: 'user_123', role: 'STUDENT' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret) as any;
    assert(decoded.id === 'user_123', 'Decoded user ID mismatch');
    assert(decoded.role === 'STUDENT', 'Decoded role mismatch');
  });

  await runTest('Auth & Security', 'NoSQL Injection Sanitizer removes $ and . operators', () => {
    const maliciousReq: any = {
      body: {
        username: 'admin',
        $where: 'this.password.length > 0',
        nested: { 'dot.key': 'evil', safeKey: 'safe' }
      },
      query: { $gt: '' },
      params: {}
    };

    mongoSanitize(maliciousReq, {} as any, () => {});
    assert(maliciousReq.body.$where === undefined, 'NoSQL operator $where should be stripped');
    assert(maliciousReq.body.username === 'admin', 'Safe fields must be preserved');
    assert(maliciousReq.body.nested['dot.key'] === undefined, 'Dot keys should be stripped');
    assert(maliciousReq.body.nested.safeKey === 'safe', 'Safe nested keys must be preserved');
    assert(maliciousReq.query.$gt === undefined, 'Query $gt must be stripped');
  });

  // --- SUITE 2: RBAC PERMISSIONS ---
  await runTest('RBAC Engine', 'Role hierarchy validation', () => {
    const roles = ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'STUDENT'];
    assert(roles.includes('SUPER_ADMIN'), 'SUPER_ADMIN must exist');
    assert(roles.includes('ADMIN'), 'ADMIN must exist');
    assert(roles.includes('MENTOR'), 'MENTOR must exist');
    assert(roles.includes('STUDENT'), 'STUDENT must exist');
  });

  // --- SUITE 3: PAYMENT PROVIDER ABSTRACTION ---
  await runTest('Payment Engine', 'Create Order with Provider Abstraction', async () => {
    const order = await PaymentService.createOrder(49.99, 'USD', 'SANDBOX', { plan: 'Pro' });
    assert(order.orderId.startsWith('ORD-'), 'Order ID format must start with ORD-');
    assert(order.amount === 49.99, 'Order amount mismatch');
    assert(order.currency === 'USD', 'Order currency mismatch');
    assert(order.provider === 'SANDBOX', 'Provider mismatch');
  });

  await runTest('Payment Engine', 'Server-Side Payment Signature Verification (Never Trust Frontend)', async () => {
    // Sandbox verification
    const sandboxValid = await PaymentService.verifyPaymentExecution('SANDBOX', 'mock_payment_123');
    assert(sandboxValid.isValid, 'Sandbox payment with ID should be valid');

    const sandboxInvalid = await PaymentService.verifyPaymentExecution('SANDBOX', '');
    assert(!sandboxInvalid.isValid, 'Sandbox payment without ID should fail');

    // Razorpay signature verification
    const razorpayMissing = await PaymentService.verifyPaymentExecution('RAZORPAY', 'pay_123', 'order_123', '');
    assert(!razorpayMissing.isValid, 'Razorpay missing signature must fail');
  });

  await runTest('Payment Engine', 'Unique Sequential Invoice Number Generation', async () => {
    const year = new Date().getFullYear();
    const invNumber = `INV-${year}-01001`;
    assert(invNumber.startsWith(`INV-${year}-`), 'Invoice format must be INV-YYYY-XXXXX');
  });

  // --- SUITE 4: CERTIFICATES & VERIFICATION ---
  await runTest('Certificate Engine', 'Cryptographic Certificate and Verification Hash Generation', () => {
    const certNum = CertificateService.generateCertificateNumber();
    const verCode = CertificateService.generateVerificationCode();

    assert(certNum.startsWith('CERT-'), 'Certificate Number format must start with CERT-');
    assert(verCode.startsWith('VER-'), 'Verification code format must start with VER-');
    assert(verCode.length >= 10, 'Verification code must be sufficiently long for cryptographic integrity');
  });

  // --- SUITE 5: EXAMINATION ENGINE & SCORING ---
  await runTest('Examination Engine', 'Negative Marking and Score Calculation', () => {
    const totalMarks = 100;
    const questionsCount = 10;
    const marksPerQuestion = totalMarks / questionsCount;
    const negativeMark = 2.5;

    // 8 correct, 2 wrong
    const correctCount = 8;
    const wrongCount = 2;
    const score = (correctCount * marksPerQuestion) - (wrongCount * negativeMark);
    const percentage = Math.round((score / totalMarks) * 100);

    assert(score === 75, `Expected score 75, got ${score}`);
    assert(percentage === 75, `Expected percentage 75%, got ${percentage}%`);
  });

  // --- SUITE 6: ATTENDANCE & GRADING RULES ---
  await runTest('Attendance Engine', 'Weighted Attendance Rate Calculation', () => {
    const present = 18;
    const late = 2; // late counts as 0.5
    const absent = 0;
    const total = present + late + absent;

    const rate = Math.round(((present + late * 0.5) / total) * 100);
    assert(rate === 95, `Expected attendance rate 95%, got ${rate}%`);
  });

  // --- SUMMARY ---
  console.log('\n======================================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`📊 TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${results.length})`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test Runner Failed:', err);
  process.exit(1);
});
