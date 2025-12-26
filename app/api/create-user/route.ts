import { NextResponse } from "next/server";
// IMPORTING THE KEYMASTER WE JUST CREATED
import { adminAuth, adminDb } from "@/lib/firebase-admin"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, department, batch, admissionNo } = body;

    // 1. Create User in Authentication (Login System)
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create User Profile in Database
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role: role || "student",
      department: department || "",
      batch: batch || "",
      admissionNo: admissionNo || "",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}