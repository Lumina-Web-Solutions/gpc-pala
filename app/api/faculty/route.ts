import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, department, phone, designation } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create User in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set Custom Claim (Role = faculty)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "faculty" });

    // 3. Save Profile to Firestore 'faculty' collection
    await adminDb.collection("faculty").doc(userRecord.uid).set({
      name,
      email,
      department,
      phone: phone || "",
      designation: designation || "Lecturer",
      role: "faculty",
      uid: userRecord.uid,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    console.error("Error creating faculty:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}