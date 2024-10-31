import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate  } from 'react-router-dom';
import { Form, Input, Button, notification, Tag, Table, Modal } from 'antd';
import axios from 'axios';
import * as XLSX from 'xlsx';

const RaffleForm = () => {
  const [number, setNumber] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const handleAdminClick = () => {
    setIsModalVisible(true); // Открываем модальное окно
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleOk = () => {
    if (password === '0000') {
      navigate('/admin'); // Переход на страницу администратора при правильном пароле
      setIsModalVisible(false);
    } else {
      notification.error({ message: 'Неверный пароль!' });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const fetchNumber = async () => {
    try {
      const response = await axios.get('https://2323e73ee73ce4dc.mokky.dev/number');
      const availableNumber = response.data.find(num => !num.busy);
      if (availableNumber) setNumber(availableNumber);
    } catch (error) {
      console.error('Error fetching number:', error);
    }
  };

  const onFinish = async (values) => {
    if (!number) {
      notification.error({ message: 'Нет свободных номерков.' });
      return;
    }

    try {
      await axios.post('https://2323e73ee73ce4dc.mokky.dev/user', { ...values, number: number.number });
      await axios.patch(`https://2323e73ee73ce4dc.mokky.dev/number/${number.id}`, { busy: true });

      const whatsappMessage = `Новый участник:\nФамилия: ${values.surname}\nИмя: ${values.name}\nТелефон: ${values.phone}\nНомер: ${number.number}`;
      window.open(`https://wa.me/номер_админа?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

      notification.success({ message: 'Заявка отправлена!' });
      fetchNumber();
    } catch (error) {
      console.error('Error submitting form:', error);
      notification.error({ message: 'Ошибка при отправке заявки.' });
    }
  };

  useEffect(() => {
    fetchNumber();
  }, []);

  useEffect(() => {
    // Устанавливаем фокус на поле ввода, если модалка видима
    if (isModalVisible) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0); // Используем таймер, чтобы гарантировать установку фокуса после рендеринга

      return () => clearTimeout(timer); // Очищаем таймер при размонтировании или закрытии модалки
    }
  }, [isModalVisible]);

  return (
    <div style={{ padding: '24px' }}>
      <h2>Розыгрыш</h2>
      <p>Заполните форму ниже, чтобы участвовать в розыгрыше.</p>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Фамилия" name="surname" rules={[{ required: true, message: 'Введите фамилию' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Имя" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Номер телефона" name="phone" rules={[{ required: true, message: 'Введите номер телефона' }]}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit">Отправить</Button>
      </Form>
      <Button type="link" onClick={handleAdminClick} style={{ marginTop: '20px' }}>
        Перейти к административной панели
      </Button>

      <Modal
  title="Введите пароль"
  visible={isModalVisible}
  onOk={handleOk}
  onCancel={handleCancel}
  okText="Подтвердить"
  cancelText="Отмена"
>
  <Input.Password
   ref={inputRef}
    placeholder="Введите пароль"
    value={password}
    onChange={handlePasswordChange}
    onPressEnter={handleOk} // Отработка по Enter
  />
</Modal>

    </div>
  );
};

const AdminPage = () => {
  const [participants, setParticipants] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const navigate = useNavigate();
  

  const fetchParticipants = async () => {
    try {
      const response = await axios.get('https://2323e73ee73ce4dc.mokky.dev/user');
      setParticipants(response.data);
    } catch (error) {
      console.error('Error fetching participants:', error);
      notification.error({ message: 'Ошибка при загрузке данных участников.' });
    }
  };

  const fetchNumbers = async () => {
    try {
      const response = await axios.get('https://2323e73ee73ce4dc.mokky.dev/number');
      setNumbers(response.data);
    } catch (error) {
      console.error('Error fetching numbers:', error);
    }
  };

  useEffect(() => {
    fetchParticipants();
    fetchNumbers();
  }, []);

  const downloadExcel = () => {
    // Преобразуем данные участников в формат подходящий для Excel
    const worksheetData = participants.map((participant) => ({
      Фамилия: participant.surname,
      Имя: participant.name,
      Телефон: participant.phone,
      Номер: participant.number,
    }));

    // Создаем книгу Excel и добавляем лист с данными
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Участники');

    // Генерируем и скачиваем файл Excel
    XLSX.writeFile(workbook, 'participants.xlsx');
  };

  const participantColumns = [
    { title: 'Фамилия', dataIndex: 'surname', key: 'surname' },
    { title: 'Имя', dataIndex: 'name', key: 'name' },
    { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
    { title: 'Номер', dataIndex: 'number', key: 'number' },
  ];

  const numberColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Номер', dataIndex: 'number', key: 'number' },
    {
      title: 'Статус',
      dataIndex: 'busy',
      key: 'busy',
      render: busy => (
        <Tag color={busy ? 'red' : 'green'}>
          {busy ? 'Занят' : 'Свободен'}
        </Tag>
      ),
    },
  ];

  const handleBackClick = () => {
    navigate(-1); 
  };

  return (
    <div style={{ padding: '24px' }}>
       <Button type="primary" onClick={handleBackClick}>
      Назад
    </Button>
      <h3>Участники</h3>
      <Table columns={participantColumns} dataSource={participants} rowKey="id" />
      <h3 style={{ marginTop: '32px' }}>Номера</h3>
      <Table columns={numberColumns} dataSource={numbers} rowKey="id" />
      <Button type="primary" onClick={downloadExcel} style={{ marginBottom: '16px' }}>
        Скачать данные в Excel
      </Button>
    </div>
  );
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<RaffleForm />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  </Router>
);

export default App;
