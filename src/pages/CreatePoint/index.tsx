import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Link, useHistory } from "react-router-dom";
import { FiSkipBack } from "react-icons/fi";
import { Map, TileLayer, Marker } from "react-leaflet";
import api from "../../services/api";
import axios from "axios";
import { LeafletMouseEvent } from "leaflet";

import "./styles.css";

import logo from "../../assets/logo.svg";

const CreatePoint = () => {
	const [items, setItems] = useState<Item[]>([]);
	const [ufs, setUfs] = useState<string[]>([]);
	const [selectedUf, setSelectedUf] = useState<string>();
	const [cities, setCities] = useState<string[]>([]);
	const [selectedCity, setSelectedCity] = useState<string>();
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
		0,
		0,
	]);
	const [inputData, setInputData] = useState({
		name: "",
		email: "",
		whatsapp: "",
	});
	const history = useHistory();

	interface Item {
		id: number;
		title: string;
		image_url: string;
	}

	interface IBGEUFResponse {
		sigla: string;
	}
	interface IBGECityResponse {
		nome: string;
	}

	useEffect(() => {
		navigator.geolocation.getCurrentPosition((position) => {
			const { latitude, longitude } = position.coords;
			setSelectedPosition([latitude, longitude]);
		});
	}, []);

	useEffect(() => {
		async function fetchData() {
			const { data } = await api.get("items");
			setItems(data);
		}
		fetchData();
	}, []);
	useEffect(() => {
		async function fetchData() {
			const { data } = await axios.get<IBGEUFResponse[]>(
				"https://servicodados.ibge.gov.br/api/v1/localidades/estados",
			);
			const ufInitials = data.map((uf) => uf.sigla);
			setUfs(ufInitials);
		}
		fetchData();
	}, []);

	async function handleSelectUf(e: ChangeEvent<HTMLSelectElement>) {
		const uf = e.target.value;
		const { data } = await axios.get<IBGECityResponse[]>(
			`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
		);
		const cityInitials = data.map((city) => city.nome);
		setCities(cityInitials);
		setSelectedUf(uf);
	}

	function handleMapClick(e: LeafletMouseEvent) {
		const { lat, lng } = e.latlng;
		setSelectedPosition([lat, lng]);
	}

	function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
		const { name, value } = e.target;
		setInputData({ ...inputData, [name]: value });
	}

	function handleSelectItem(id: number) {
		const alreadySelected = selectedItems.findIndex((item) => item === id) >= 0;

		if (alreadySelected) {
			const filteredItems = selectedItems.filter((item) => item !== id);
			setSelectedItems(filteredItems);
		} else {
			setSelectedItems([...selectedItems, id]);
		}
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const { name, email, whatsapp } = inputData;
		const uf = selectedUf;
		const city = selectedCity;
		const [latitude, longitude] = selectedPosition;
		const items = selectedItems;

		const data = {
			name,
			email,
			whatsapp,
			uf,
			city,
			latitude,
			longitude,
			items,
		};
		try {
			await api.post("points", data);
			alert("Ponto de coleta cadastrado.");
			history.push("/");
		} catch (err) {
			alert("Preencha todos os campos.");
		}
	}

	return (
		<div id="page-create-point">
			<header>
				<img src={logo} alt="Ecoleta" />
				<Link to="/">
					<FiSkipBack />
					Voltar para home
				</Link>
			</header>
			<form onSubmit={handleSubmit}>
				<h1>
					Cadastro do <br /> ponto de coleta.
				</h1>
				<fieldset>
					<legend>
						<h2>Dados</h2>
					</legend>

					<div className="field">
						<label htmlFor="name">Nome da entidade</label>
						<input
							type="text"
							name="name"
							id="name"
							onChange={handleInputChange}></input>
					</div>

					<div className="field-group">
						<div className="field">
							<label htmlFor="email">Email</label>
							<input
								type="email"
								name="email"
								id="email"
								onChange={handleInputChange}></input>
						</div>

						<div className="field">
							<label htmlFor="whatsapp">Whatsapp</label>
							<input
								type="text"
								name="whatsapp"
								id="whatsapp"
								onChange={handleInputChange}></input>
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend>
						<h2>Endereço</h2>
						<span>Selecione o endereço no mapa.</span>
					</legend>
					<Map center={selectedPosition} zoom={15} onClick={handleMapClick}>
						<TileLayer
							attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						<Marker position={selectedPosition} />
					</Map>
					<div className="field-group">
						<div className="field">
							<label htmlFor="uf">Estado(UF)</label>
							<select name="uf" id="uf" onChange={handleSelectUf}>
								<option value="0">Selecione uma UF</option>
								{ufs.map((uf) => (
									<option value={uf}>{uf}</option>
								))}
							</select>
						</div>
					</div>
					<div className="field-group">
						<div className="field">
							<label htmlFor="city">Cidade</label>
							<select
								name="city"
								id="city"
								onChange={(e) => setSelectedCity(e.target.value)}>
								<option value="0">Selecione uma cidade</option>
								{cities.map((city) => {
									return <option value={city}>{city}</option>;
								})}
							</select>
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend>
						<h2>Itens de coleta</h2>
						<span>Selecione um ou mais itens abaixo</span>
					</legend>
					<ul className="items-grid">
						{items.map((item) => {
							return (
								<li
									key={item.id}
									onClick={() => handleSelectItem(item.id)}
									className={selectedItems.includes(item.id) ? "selected" : ""}>
									<img src={item.image_url} alt={item.title} />
									<span>{item.title}</span>
								</li>
							);
						})}
					</ul>
				</fieldset>
				<button type="submit">Cadastrar ponto de coleta</button>
			</form>
		</div>
	);
};

export default CreatePoint;
