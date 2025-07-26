import React, { useState, KeyboardEvent, useEffect } from 'react';
import { PlusCircle, Trash2, ArrowRight, ArrowLeft, Download, FileDown, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BillDetail {
  name: string;
  amount: string;
  tax: string;
  participants: string[];
}

interface BillSplit {
  person: string;
  total: number;
  breakdown: {
    billName: string;
    amount: number;
    baseAmount: number;
    taxAmount: number;
  }[];
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountTitle: string;
}

export const App = () => {
  const [step, setStep] = useState(1);
  const [people, setPeople] = useState<string[]>(['']);
  const [bills, setBills] = useState<string[]>(['']);
  const [billDetails, setBillDetails] = useState<BillDetail[]>([]);
  const [splits, setSplits] = useState<BillSplit[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState(() => {
    const saved = localStorage.getItem('currencySymbol');
    return saved || '$';
  });
  const [customCurrency, setCustomCurrency] = useState(() => {
    const saved = localStorage.getItem('customCurrency');
    return saved || '';
  });
  const [customCurrencyError, setCustomCurrencyError] = useState('');
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [bankInfo, setBankInfo] = useState<BankInfo>(() => {
    const saved = localStorage.getItem('bankInfo');
    return saved ? JSON.parse(saved) : {
      bankName: '',
      accountNumber: '',
      accountTitle: ''
    };
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (currencySymbol) {
      localStorage.setItem('currencySymbol', currencySymbol);
    }
    if (customCurrency) {
      localStorage.setItem('customCurrency', customCurrency);
    }
  }, [currencySymbol, customCurrency]);

  useEffect(() => {
    localStorage.setItem('bankInfo', JSON.stringify(bankInfo));
  }, [bankInfo]);

  const handleKeyPress = (
    e: KeyboardEvent<HTMLInputElement>,
    type: 'people' | 'bills',
    index: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'people') {
        setPeople([...people, '']);
        setTimeout(() => {
          const inputs = document.querySelectorAll(`input[data-type="${type}"]`);
          const newInput = inputs[inputs.length - 1] as HTMLInputElement;
          newInput.focus();
        }, 0);
      } else {
        setBills([...bills, '']);
        setTimeout(() => {
          const inputs = document.querySelectorAll(`input[data-type="${type}"]`);
          const newInput = inputs[inputs.length - 1] as HTMLInputElement;
          newInput.focus();
        }, 0);
      }
    }
  };

  const handleDetailKeyPress = (
    e: KeyboardEvent<HTMLInputElement>,
    billIndex: number,
    field: 'amount' | 'tax'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = document.querySelectorAll('input[type="number"]');
      const currentIndex = Array.from(inputs).findIndex(input => input === e.target);
      const nextInput = inputs[currentIndex + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleInputKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = document.querySelectorAll('input:not([data-type="people"]):not([data-type="bills"])');
      const currentIndex = Array.from(inputs).findIndex(input => input === e.target);
      const nextInput = inputs[currentIndex + 1];
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleCustomCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/\d/.test(value)) {
      setCustomCurrencyError('Please enter a symbol or letter');
    } else {
      setCustomCurrencyError('');
      setCustomCurrency(value);
      setCurrencySymbol('');
    }
  };

  const addPerson = () => {
    setPeople([...people, '']);
  };

  const addBill = () => {
    setBills([...bills, '']);
  };

  const updatePerson = (index: number, value: string) => {
    const newPeople = [...people];
    newPeople[index] = value;
    setPeople(newPeople);
  };

  const updateBill = (index: number, value: string) => {
    const newBills = [...bills];
    newBills[index] = value;
    setBills(newBills);
  };

  const removePerson = (index: number) => {
    if (people.length > 1) {
      const newPeople = people.filter((_, i) => i !== index);
      setPeople(newPeople);
    }
  };

  const removeBill = (index: number) => {
    if (bills.length > 1) {
      const newBills = bills.filter((_, i) => i !== index);
      setBills(newBills);
    }
  };

  const validateStep1 = () => {
    const newErrors: string[] = [];
    const filledPeople = people.filter(person => person.trim() !== '');
    const filledBills = bills.filter(bill => bill.trim() !== '');
    
    if (filledPeople.length < 2) {
      newErrors.push('Please add at least 2 people');
    }
    if (filledBills.length < 1) {
      newErrors.push('Please add at least 1 bill');
    }
    if (showPaymentDetails) {
      if (!bankInfo.bankName) newErrors.push('Please enter bank name');
      if (!bankInfo.accountNumber) newErrors.push('Please enter account number');
      if (!bankInfo.accountTitle) newErrors.push('Please enter account title');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleContinue = () => {
    if (!validateStep1()) {
      window.scrollTo(0, 0);
      return;
    }

    const filledPeople = people.filter(person => person.trim() !== '');
    const filledBills = bills.filter(bill => bill.trim() !== '');

    if (billDetails.length === 0) {
      const initialBillDetails = filledBills.map(bill => ({
        name: bill,
        amount: '',
        tax: '',
        participants: []
      }));
      setBillDetails(initialBillDetails);
    }
    setStep(2);
    setErrors([]);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors([]);
    window.scrollTo(0, 0);
  };

  const updateBillDetail = (index: number, field: keyof BillDetail, value: string | string[]) => {
    const newBillDetails = [...billDetails];
    newBillDetails[index] = { ...newBillDetails[index], [field]: value };
    setBillDetails(newBillDetails);
  };

  const toggleParticipant = (billIndex: number, person: string) => {
    const bill = billDetails[billIndex];
    const newParticipants = bill.participants.includes(person)
      ? bill.participants.filter(p => p !== person)
      : [...bill.participants, person];
    updateBillDetail(billIndex, 'participants', newParticipants);
  };

  const toggleAllParticipants = (billIndex: number) => {
    const bill = billDetails[billIndex];
    const allPeople = people.filter(p => p.trim() !== '');
    const hasAllParticipants = bill.participants.length === allPeople.length;
    
    updateBillDetail(
      billIndex,
      'participants',
      hasAllParticipants ? [] : allPeople
    );
  };

  const validateStep2 = () => {
    const newErrors: string[] = [];
    
    for (const bill of billDetails) {
      if (!bill.amount) {
        newErrors.push(`Please enter amount for ${bill.name}`);
      }
      if (bill.participants.length === 0) {
        newErrors.push(`Please select participants for ${bill.name}`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculateSplits = () => {
    if (!validateStep2()) {
      window.scrollTo(0, 0);
      return;
    }

    const personSplits: { [key: string]: BillSplit } = {};
    
    people.forEach(person => {
      if (person.trim()) {
        personSplits[person] = {
          person,
          total: 0,
          breakdown: []
        };
      }
    });

    billDetails.forEach(bill => {
      const amount = parseFloat(bill.amount);
      const taxPercentage = bill.tax ? parseFloat(bill.tax) : 0;
      const taxAmount = amount * (taxPercentage / 100);
      const totalAmount = amount + taxAmount;
      const splitAmount = totalAmount / bill.participants.length;
      const baseSplitAmount = amount / bill.participants.length;
      const taxSplitAmount = taxAmount / bill.participants.length;

      bill.participants.forEach(person => {
        personSplits[person].total += splitAmount;
        personSplits[person].breakdown.push({
          billName: bill.name,
          amount: splitAmount,
          baseAmount: baseSplitAmount,
          taxAmount: taxSplitAmount
        });
      });
    });

    setSplits(Object.values(personSplits));
    setStep(3);
    setErrors([]);
    window.scrollTo(0, 0);
  };

  const handleStartOver = () => {
    setPeople(['']);
    setBills(['']);
    setBillDetails([]);
    setSplits([]);
    setStep(1);
    setErrors([]);
    window.scrollTo(0, 0);
  };

  const handleSharePNG = async () => {
    const element = document.getElementById('summary-content');
    if (element) {
      const buttonsContainer = document.getElementById('action-buttons');
      if (buttonsContainer) buttonsContainer.style.display = 'none';
      
      const canvas = await html2canvas(element, {
        margin: 16,
        backgroundColor: 'white'
      });
      
      if (buttonsContainer) buttonsContainer.style.display = 'flex';
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'bill-split-summary.png';
      link.href = dataUrl;
      link.click();
    }
  };

  const handleSharePDF = async () => {
    const element = document.getElementById('summary-content');
    if (element) {
      const buttonsContainer = document.getElementById('action-buttons');
      if (buttonsContainer) buttonsContainer.style.display = 'none';
      
      const canvas = await html2canvas(element, {
        margin: 16,
        backgroundColor: 'white'
      });
      
      if (buttonsContainer) buttonsContainer.style.display = 'flex';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width + 32, canvas.height + 32]
      });
      pdf.addImage(imgData, 'PNG', 16, 16, canvas.width, canvas.height);
      pdf.save('bill-split-summary.pdf');
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-black mb-2 text-center">billbanto</h1>
          <p className="text-gray-500 text-center mb-8">split bills effortlessly</p>
          
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              {errors.map((error, index) => (
                <p key={index} className="text-red-600">{error}</p>
              ))}
            </div>
          )}
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <div className="flex gap-2 flex-wrap">
              {['$', '£', '€', 'Rs'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setCurrencySymbol(option);
                    setCustomCurrency('');
                    setCustomCurrencyError('');
                  }}
                  className={`px-4 py-2 rounded-md ${
                    currencySymbol === option && !customCurrency
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
              <div className="flex-1">
                <input
                  type="text"
                  value={customCurrency}
                  onChange={handleCustomCurrencyChange}
                  placeholder="Custom e.g. AED, CAD"
                  className={`w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent ${
                    customCurrencyError ? 'border-red-500' : ''
                  }`}
                  onKeyPress={handleInputKeyPress}
                />
                {customCurrencyError && (
                  <p className="mt-1 text-sm text-red-500">{customCurrencyError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Who are you splitting the bills with?</h2>
            {people.map((person, index) => (
              <div key={index} className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={person}
                  onChange={(e) => updatePerson(index, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'people', index)}
                  placeholder="Enter name"
                  data-type="people"
                  className="flex-1 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <button
                  onClick={() => removePerson(index)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                  disabled={people.length === 1}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={addPerson}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mt-2"
            >
              <PlusCircle size={20} />
              <span>Add Person</span>
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What bills are you splitting?</h2>
            {bills.map((bill, index) => (
              <div key={index} className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={bill}
                  onChange={(e) => updateBill(index, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'bills', index)}
                  placeholder="Enter bill e.g. Careem, Pasta, Drinks, etc"
                  data-type="bills"
                  className="flex-1 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <button
                  onClick={() => removeBill(index)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                  disabled={bills.length === 1}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={addBill}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mt-2"
            >
              <PlusCircle size={20} />
              <span>Add Bill</span>
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPaymentDetails}
                  onChange={(e) => setShowPaymentDetails(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                <span className="ml-3 text-sm text-gray-600">Show payment details</span>
              </label>
            </div>
            {showPaymentDetails && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankInfo.bankName}
                    onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    onKeyPress={handleInputKeyPress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number/IBAN
                  </label>
                  <input
                    type="text"
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    onKeyPress={handleInputKeyPress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Title
                  </label>
                  <input
                    type="text"
                    value={bankInfo.accountTitle}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountTitle: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    onKeyPress={handleInputKeyPress}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            Continue
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-black mb-2 text-center">billbanto</h1>
          <p className="text-gray-500 text-center mb-8">split bills effortlessly</p>
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Enter bill details</h2>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              {errors.map((error, index) => (
                <p key={index} className="text-red-600">{error}</p>
              ))}
            </div>
          )}

          {billDetails.map((bill, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{bill.name}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount ({customCurrency || currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={bill.amount}
                    onChange={(e) => updateBillDetail(index, 'amount', e.target.value)}
                    onKeyPress={(e) => handleDetailKeyPress(e, index, 'amount')}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    value={bill.tax}
                    onChange={(e) => updateBillDetail(index, 'tax', e.target.value)}
                    onKeyPress={(e) => handleDetailKeyPress(e, index, 'tax')}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select People
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleAllParticipants(index)}
                      className={`p-2 rounded-md text-sm font-medium transition-colors ${
                        bill.participants.length === people.filter(p => p.trim() !== '').length
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {bill.participants.length === people.filter(p => p.trim() !== '').length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                    {people.filter(p => p.trim() !== '').map((person, personIndex) => (
                      <button
                        key={personIndex}
                        onClick={() => toggleParticipant(index, person)}
                        className={`p-2 rounded-md text-sm font-medium transition-colors ${
                          bill.participants.includes(person)
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {person}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <button
              onClick={() => {
                handleBack();
                window.scrollTo(0, 0);
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <button
              onClick={calculateSplits}
              className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              Calculate Split
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={handleSharePNG}
            className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={20} />
            Share PNG
          </button>
          <button
            onClick={handleSharePDF}
            className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors"
          >
            <FileDown size={20} />
            Share PDF
          </button>
        </div>

        <div id="summary-content" className="space-y-8 p-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black mb-2">billbanto</h1>
            <p className="text-gray-500 mb-2">split bills effortlessly</p>
            <div className="text-gray-400 text-sm">
              built by <a href="https://www.instagram.com/ajaowan" target="_blank" rel="noopener noreferrer" className="underline">@ajaowan</a> 🇵🇰
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Total Summary</h2>
              <span className="text-gray-500">{dateString}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {splits.map((split, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                  <div className="font-medium text-gray-900">{split.person}</div>
                  <div className="text-xl font-bold text-black mt-1">
                    {customCurrency || currencySymbol}{Math.ceil(split.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showPaymentDetails && bankInfo.bankName && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium">Bank:</span> {bankInfo.bankName}</p>
                <p><span className="font-medium">Account Number/IBAN:</span> {bankInfo.accountNumber}</p>
                <p><span className="font-medium">Account Title:</span> {bankInfo.accountTitle}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Breakdown</h2>
            {splits.map((split, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{split.person}</h3>
                  <div className="text-xl font-bold text-black">
                    {customCurrency || currencySymbol}{split.total.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-3">
                  {split.breakdown.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-800">{item.billName}</h4>
                        <span className="font-semibold text-black">
                          {customCurrency || currencySymbol}{item.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex justify-between">
                          <span>Base amount:</span>
                          <span>{customCurrency || currencySymbol}{item.baseAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax amount:</span>
                          <span>{customCurrency || currencySymbol}{item.taxAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        
          {/*}
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <a href="https://bill.ajaowan.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 underline">
              split your own bill
            </a>
          </div>
          */}
        </div>

        <div id="action-buttons" className="mt-6 space-y-4">
          <button
            onClick={() => setStep(2)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <button
            onClick={handleStartOver}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={20} />
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
};