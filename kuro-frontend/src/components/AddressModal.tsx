import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import axios from 'axios';

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (addressData: any) => Promise<void>;
    initialData?: any;
}

export default function AddressModal({ isOpen, onClose, onSave, initialData }: AddressModalProps) {
    const [formData, setFormData] = useState({
        alias: '',
        street: '',
        exterior_number: '',
        interior_number: '',
        neighborhood: '',
        reference: '',
        phone: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'México',
        is_default: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Sepomex state
    const [searchingZip, setSearchingZip] = useState(false);
    const [coloniasDescubiertas, setColoniasDescubiertas] = useState<string[]>([]);
    const [zipError, setZipError] = useState('');

    const ESTADOS_MEXICO = [
        "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
        "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
        "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
        "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
        "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
    ];

    useEffect(() => {
        if (initialData) {
            setFormData({
                alias: initialData.alias || '',
                street: initialData.street || '',
                exterior_number: initialData.exterior_number || '',
                interior_number: initialData.interior_number || '',
                neighborhood: initialData.neighborhood || '',
                reference: initialData.reference || '',
                phone: initialData.phone || '',
                city: initialData.city || '',
                state: initialData.state || '',
                postal_code: initialData.postal_code || '',
                country: initialData.country || 'México',
                is_default: initialData.is_default || false
            });
        } else {
            setFormData({
                alias: '',
                street: '',
                exterior_number: '',
                interior_number: '',
                neighborhood: '',
                reference: '',
                phone: '',
                city: '',
                state: '',
                postal_code: '',
                country: 'México',
                is_default: false
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    useEffect(() => {
        if (formData.postal_code.length === 5) {
            buscarCodigoPostal(formData.postal_code);
        } else {
            setColoniasDescubiertas([]);
            setZipError('');
        }
    }, [formData.postal_code]);

    const buscarCodigoPostal = async (cp: string) => {
        setSearchingZip(true);
        setZipError('');
        try {
            const response = await axios.get(`https://api.zippopotam.us/mx/${cp}`);
            if (response.data && response.data.places) {
                const places = response.data.places;
                const estado = places[0].state;
                const colonias = places.map((p: any) => p['place name']);
                setColoniasDescubiertas(colonias);
                setFormData(prev => ({
                    ...prev,
                    state: estado,
                    city: prev.city || '',
                    neighborhood: colonias.includes(prev.neighborhood) ? prev.neighborhood : colonias[0] || ''
                }));
            }
        } catch (error) {
            setZipError('No se encontró el C.P. Ingresa tus datos manualmente.');
            setColoniasDescubiertas([]);
        } finally {
            setSearchingZip(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError('Error al guardar la dirección. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 transition-all">
            <div className="bg-[#161616] border border-[#2d2d2d] rounded-sm shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
                <div className="flex justify-between items-center p-4 border-b border-[#2d2d2d] bg-[#0e0e0e]">
                    <h3 className="font-bold text-[#f0f0f0] uppercase tracking-widest text-sm">
                        {initialData ? 'Editar Dirección' : 'Añadir Dirección'}
                    </h3>
                    <button onClick={onClose} className="text-[#555555] hover:text-[#f0f0f0] transition-colors">
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 custom-scrollbar relative">
                    {error && (
                        <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-sm text-[10px] uppercase tracking-widest font-bold">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Nombre (Alias) *</label>
                        <input
                            required
                            type="text"
                            name="alias"
                            placeholder="Ej: Mi Casa, Trabajo"
                            value={formData.alias}
                            onChange={handleChange}
                            className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                        />
                    </div>

                    <div className="bg-[#0e0e0e] p-4 rounded-sm border border-[#2d2d2d] mb-2">
                        <p className="text-[10px] text-[#888888] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                            <Search size={14} strokeWidth={2} /> Captura tu Código Postal
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#555555] mb-1">C.P. *</label>
                                <div className="relative flex items-center">
                                    <input
                                        required
                                        type="text"
                                        name="postal_code"
                                        maxLength={5}
                                        placeholder="Ej: 74200"
                                        value={formData.postal_code}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            e.target.value = val;
                                            handleChange(e);
                                        }}
                                        className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                                    />
                                    {searchingZip && (
                                        <div className="absolute right-3 animate-spin rounded-full h-4 w-4 border-b-2 border-[#f0f0f0]"></div>
                                    )}
                                </div>
                                {zipError && <p className="text-[10px] uppercase tracking-widest font-bold text-red-400 mt-2">{zipError}</p>}
                                {coloniasDescubiertas.length > 0 && !zipError && (
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-green-400 mt-2">¡C.P. encontrado!</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#555555] mb-1">País *</label>
                                <input
                                    required
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full bg-[#161616] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#555555] cursor-not-allowed focus:outline-none"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Estado *</label>
                            <select
                                required
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors appearance-none"
                            >
                                <option value="" disabled className="text-[#555555]">Selecciona</option>
                                {ESTADOS_MEXICO.map((estado, idx) => (
                                    <option key={idx} value={estado}>{estado}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Ciudad/Municipio *</label>
                            <input
                                required
                                type="text"
                                name="city"
                                placeholder="Ej: Atlixco"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Colonia *</label>
                            {coloniasDescubiertas.length > 0 ? (
                                <select
                                    required
                                    name="neighborhood"
                                    value={formData.neighborhood}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors appearance-none"
                                >
                                    <option value="" disabled className="text-[#555555]">Selecciona</option>
                                    {coloniasDescubiertas.map((col, idx) => (
                                        <option key={idx} value={col}>{col}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    required
                                    type="text"
                                    name="neighborhood"
                                    placeholder="Ej: Centro"
                                    value={formData.neighborhood}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Teléfono *</label>
                            <div className="flex bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm overflow-hidden focus-within:border-[#555555] transition-colors">
                                <span className="bg-[#0e0e0e] border-r border-[#2d2d2d] px-3 py-2 text-sm text-[#888888] flex items-center font-bold">
                                    +52
                                </span>
                                <input
                                    required
                                    type="tel"
                                    name="phone"
                                    maxLength={10}
                                    placeholder="5512345678"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        e.target.value = val;
                                        handleChange(e);
                                    }}
                                    className="w-full px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none bg-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Calle *</label>
                            <input
                                required
                                type="text"
                                name="street"
                                placeholder="Ej: Av. Reforma"
                                value={formData.street}
                                onChange={handleChange}
                                className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Nº Ext *</label>
                                <input
                                    required
                                    type="text"
                                    name="exterior_number"
                                    placeholder="123"
                                    value={formData.exterior_number}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Nº Int</label>
                                <input
                                    type="text"
                                    name="interior_number"
                                    placeholder="B"
                                    value={formData.interior_number}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-[#888888] mb-1">Referencias de entrega</label>
                        <input
                            type="text"
                            name="reference"
                            placeholder="Ej: Portón negro..."
                            value={formData.reference}
                            onChange={handleChange}
                            className="w-full bg-[#1f1f1f] border border-[#2d2d2d] rounded-sm px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#555555] transition-colors"
                        />
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="is_default"
                                checked={formData.is_default}
                                onChange={handleChange}
                                className="w-4 h-4 bg-[#1f1f1f] border-[#2d2d2d] text-[#f0f0f0] focus:ring-[#555555] rounded-sm cursor-pointer"
                            />
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#888888] group-hover:text-[#f0f0f0] transition-colors cursor-pointer">
                                Establecer como principal
                            </span>
                        </label>
                    </div>

                    <div className="sticky bottom-[-16px] -mx-4 -mb-4 pt-4 pb-4 px-4 bg-[#161616] border-t border-[#2d2d2d] flex gap-3 mt-4 z-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-[#1f1f1f] border border-[#2d2d2d] text-[#888888] rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-[#2d2d2d] hover:text-[#f0f0f0] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-[#f0f0f0] text-[#0e0e0e] rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
