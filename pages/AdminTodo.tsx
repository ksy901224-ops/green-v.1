
import React, { useEffect, useState } from 'react';
import { getAllTodos, updateTodo, deleteTodo, TodoItem } from '../services/firestoreService';
import { Loader2, Trash2, Check, X, Edit2, Save } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { UserRole } from '../types';

const AdminTodo: React.FC = () => {
  const { user, navigate } = useApp();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Permission Check
  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      alert('관리자만 접근할 수 있습니다.');
      navigate('/');
    }
  }, [user, navigate]);

  const fetchTodos = async () => {
    setLoading(true);
    const data = await getAllTodos();
    setTodos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await deleteTodo(id);
      fetchTodos();
    }
  };

  const handleToggleComplete = async (todo: TodoItem) => {
    if (!todo.id) return;
    await updateTodo(todo.id, { isCompleted: !todo.isCompleted });
    fetchTodos();
  };

  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id || null);
    setEditText(todo.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (id: string) => {
    await updateTodo(id, { text: editText });
    setEditingId(null);
    fetchTodos();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">할 일 관리 (Admin)</h1>
        <p className="text-slate-500 text-sm">데이터베이스에 저장된 모든 사용자의 할 일을 관리합니다.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-16 text-center">상태</th>
              <th className="px-4 py-3">작성자</th>
              <th className="px-4 py-3">내용</th>
              <th className="px-4 py-3">작성일시</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {todos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">데이터가 없습니다.</td>
              </tr>
            ) : (
              todos.map((todo) => (
                <tr key={todo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleToggleComplete(todo)}
                      className={`p-1 rounded-full ${todo.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}
                    >
                      <Check size={14} />
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{todo.author}</td>
                  <td className="px-4 py-3">
                    {editingId === todo.id ? (
                      <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          value={editText} 
                          onChange={(e) => setEditText(e.target.value)}
                          className="border border-brand-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
                        />
                      </div>
                    ) : (
                      <span className={todo.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}>
                        {todo.text}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {todo.createdAt?.seconds 
                      ? new Date(todo.createdAt.seconds * 1000).toLocaleString() 
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {editingId === todo.id ? (
                      <>
                        <button onClick={() => saveEdit(todo.id!)} className="text-green-600 hover:bg-green-50 p-1 rounded" title="저장">
                          <Save size={16} />
                        </button>
                        <button onClick={cancelEdit} className="text-slate-500 hover:bg-slate-100 p-1 rounded" title="취소">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(todo)} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="수정">
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(todo.id!)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="삭제">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTodo;
