import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { logout } from '../auth/authService';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const { firebaseUser, userProfile, loading } = useAuth();

  if (loading) return null;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval / รออนุมัติ</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {userProfile.status === 'pending' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ
              </div>
            )}
            {userProfile.status === 'rejected' && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  navigate('/dashboard');
                }}
              >
                Back
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

