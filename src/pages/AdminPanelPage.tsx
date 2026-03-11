import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export function AdminPanelPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            หน้านี้ถูกเตรียมไว้สำหรับเครื่องมือผู้ดูแลระบบ (การจัดการผู้ใช้จะเปิดจากเมนูด้านซ้ายล่างตามที่กำหนด)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

