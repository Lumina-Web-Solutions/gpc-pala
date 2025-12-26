import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, regNo, batchId, batchName, studentType, phone, dob, bloodGroup } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create User in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set Custom Claims (Role = student)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "student" });

    // 3. Save Student Profile to Firestore
    await adminDb.collection("students").doc(userRecord.uid).set({
      name,
      email,
      regNo: regNo || "",
      batchId,
      batchName,
      studentType,
      phone: phone || "",
      dob: dob || "",
      bloodGroup: bloodGroup || "",
      role: "student",
      uid: userRecord.uid,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}