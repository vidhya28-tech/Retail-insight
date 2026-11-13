import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import "./analytics.css";
import { BarChart3, BookOpen, Database, Layers3, LineChart, Menu, ShieldAlert, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Legend } from "recharts";
import analysis from "../../reports/analysis_results.json";
import cleanedCsv from "../../data/processed/retail_public.csv?raw";

const sections = ["Overview", "Data audit", "Profitability", "Seasonality", "Product velocity", "Deliverables"];
const icons = [BarChart3, ShieldAlert, LineChart, Layers3, Database, BookOpen];
const palette = ["#A85D45", "#7D9676", "#708DA3", "#C28A6B"];
const conversionRate = 84;
type Row = Record<string, any>;
type Filters = { startDate: string; endDate: string; country: string; state: string; city: string; region: string; category: string; segment: string };
const metadata = analysis.dataset as any;
const initialFilters: Filters = { startDate: metadata.date_min, endDate: metadata.date_max, country: "", state: "", city: "", region: "", category: "", segment: "" };
const colors = { grid: "#eee7df", axis: "#8c7d70", tooltip: "#FFFCF7" };

function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value); rows.push(row); row = []; value = "";
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.filter((record) => record.some(Boolean)).map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
}
const n = (row: Row, field: string) => Number(row[field] ?? 0);
const sum = (rows: Row[], field: string) => rows.reduce((total, row) => total + n(row, field), 0);
const money = (sourceAmount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(sourceAmount * conversionRate);
function uniqueValues(rows: Row[], field: string) { return [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b)); }
function locationKey(value: unknown) { return String(value ?? "").trim().toLowerCase(); }
function locationOptions(rows: Row[], field: string) {
  const values = new Map<string, string>();
  for (const row of rows) {
    const label = String(row[field] ?? "").trim();
    const key = locationKey(label);
    if (key && !values.has(key)) values.set(key, label);
  }
  return [...values.values()].sort((a, b) => a.localeCompare(b));
}
function group(rows: Row[], keys: string[]): Row[] {
  const buckets = new Map<string, Row & { Sales: number; Profit: number; Quantity: number; Discount: number; Lines: number; _orders: Set<string> }>();
  for (const row of rows) {
    const id = keys.map((key) => row[key] ?? "").join("\u001f");
    let item = buckets.get(id);
    if (!item) { item = { ...Object.fromEntries(keys.map((key) => [key, row[key] ?? ""])), Sales: 0, Profit: 0, Quantity: 0, Discount: 0, Lines: 0, _orders: new Set<string>() }; buckets.set(id, item); }
    item.Sales += n(row, "Sales"); item.Profit += n(row, "Profit"); item.Quantity += n(row, "Quantity"); item.Discount += n(row, "Discount"); item.Lines++;
    if (row["Order ID"]) item._orders.add(row["Order ID"]);
  }
  return [...buckets.values()].map(({ _orders, ...item }) => ({ ...item, Orders: _orders.size, Margin: item.Sales ? item.Profit / item.Sales * 100 : 0 }));
}
function Panel({ title, subtitle, children, unit }: { title: string; subtitle?: string; children: ReactNode; unit?: string }) {
  return <article className="panel chart-panel"><div className="panel-heading"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{unit && <span className="chart-unit">{unit}</span>}</div>{children}</article>;
}
function ChartWrap({ children }: { children: ReactElement }) { return <div className="data-chart"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>; }
function SelectFilter({ label, value, choices, onChange }: { label: string; value: string; choices: string[]; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}><option value="">All {label}</option>{choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select></label>;
}

export default function Index() {
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Row[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    try {
      const rows = parseCsv(cleanedCsv);
      if (rows.length !== metadata.clean_rows) {
        throw new Error(`Expected ${metadata.clean_rows.toLocaleString("en-IN")} cleaned order lines, received ${rows.length.toLocaleString("en-IN")}`);
      }
      setTransactions(rows);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not parse the cleaned transaction CSV.");
    } finally {
      setLoading(false);
    }
  }, []);

  const countries = useMemo(() => locationOptions(transactions, "Country/Region"), [transactions]);
  const states = useMemo(() => locationOptions(transactions.filter((row) => !filters.country || locationKey(row["Country/Region"]) === locationKey(filters.country)), "State/Province"), [transactions, filters.country]);
  const cities = useMemo(() => locationOptions(transactions.filter((row) => (!filters.country || locationKey(row["Country/Region"]) === locationKey(filters.country)) && (!filters.state || locationKey(row["State/Province"]) === locationKey(filters.state))), "City"), [transactions, filters.country, filters.state]);
  const categories = useMemo(() => uniqueValues(transactions, "Category"), [transactions]);
  const segments = useMemo(() => uniqueValues(transactions, "Segment"), [transactions]);
  const regions = useMemo(() => uniqueValues(transactions, "Region"), [transactions]);

  const dateFiltered = useMemo(() => transactions.filter((row) => {
    const date = row["Order Date"] ?? "";
    return date >= filters.startDate && date <= filters.endDate;
  }), [transactions, filters.startDate, filters.endDate]);
  const filtered = useMemo(() => dateFiltered.filter((row) =>
    (!filters.country || locationKey(row["Country/Region"]) === locationKey(filters.country))
      && (!filters.state || locationKey(row["State/Province"]) === locationKey(filters.state))
      && (!filters.city || locationKey(row.City) === locationKey(filters.city))
      && (!filters.region || row.Region === filters.region)
      && (!filters.category || row.Category === filters.category)
      && (!filters.segment || row.Segment === filters.segment)
  ), [dateFiltered, filters.country, filters.state, filters.city, filters.region, filters.category, filters.segment]);

  const observedMonths = useMemo(() => new Set(dateFiltered.map((row) => (row["Order Date"] ?? "").slice(0, 7)).filter(Boolean)).size, [dateFiltered]);

  const categoryData = useMemo(() => group(filtered, ["Category"]).sort((a,b)=>b.Sales-a.Sales), [filtered]);
  const subcategoryData = useMemo(() => group(filtered, ["Category", "Sub-Category"]).sort((a,b)=>a.Profit-b.Profit), [filtered]);
  const regionData = useMemo(() => group(filtered, ["Region"]).sort((a,b)=>b.Sales-a.Sales), [filtered]);
  const seasonData = useMemo(() => {
    const definitions = [{ Season: "Spring", months: [3, 4, 5] }, { Season: "Summer", months: [6, 7, 8] }, { Season: "Autumn", months: [9, 10, 11] }, { Season: "Winter", months: [12, 1, 2] }];
    const buckets = new Map(definitions.map(({ Season }) => [Season, { Season, Sales: 0, Profit: 0, Quantity: 0, Lines: 0, years: new Map() }]));
    const observedMonths = new Set(dateFiltered.map((row) => (row["Order Date"] ?? "").slice(0, 7)));
    const observedYears = new Map(definitions.map(({ Season }) => [Season, new Set<number>()]));
    for (const row of dateFiltered) {
      const date = row["Order Date"] ?? "";
      const year = Number(date.slice(0, 4)), month = Number(date.slice(5, 7));
      const Season = month >= 3 && month <= 5 ? "Spring" : month >= 6 && month <= 8 ? "Summer" : month >= 9 && month <= 11 ? "Autumn" : "Winter";
      observedYears.get(Season).add(Season === "Winter" && month === 12 ? year + 1 : year);
    }
    for (const row of filtered) {
      const date = row["Order Date"] ?? "";
      const year = Number(date.slice(0, 4)), month = Number(date.slice(5, 7));
      const Season = month >= 3 && month <= 5 ? "Spring" : month >= 6 && month <= 8 ? "Summer" : month >= 9 && month <= 11 ? "Autumn" : "Winter";
      const seasonYear = Season === "Winter" && month === 12 ? year + 1 : year;
      const bucket = buckets.get(Season);
      bucket.Sales += n(row, "Sales"); bucket.Profit += n(row, "Profit"); bucket.Quantity += n(row, "Quantity"); bucket.Lines++;
      const totals = bucket.years.get(seasonYear) ?? { Sales: 0, Profit: 0 };
      totals.Sales += n(row, "Sales"); totals.Profit += n(row, "Profit"); bucket.years.set(seasonYear, totals);
    }
    return definitions.map(({ Season, months }) => {
      const bucket = buckets.get(Season);
      const completeYears = [...observedYears.get(Season)].filter((year) => {
        const seasonMonths = Season === "Winter" ? [[year - 1, 12], [year, 1], [year, 2]] : months.map((month) => [year, month]);
        return seasonMonths.every(([yearNumber, monthNumber]) => {
          const month = String(monthNumber).padStart(2, "0");
          const lastDay = new Date(Date.UTC(yearNumber, monthNumber, 0)).getUTCDate();
          const key = String(yearNumber) + "-" + month;
          return filters.startDate <= key + "-01" && filters.endDate >= key + "-" + String(lastDay).padStart(2, "0") && observedMonths.has(key);
        });
      }).map((year) => bucket.years.get(year) ?? { Sales: 0, Profit: 0 });
      const average = (field: "Sales" | "Profit") => completeYears.length ? completeYears.reduce((total, row) => total + row[field], 0) / completeYears.length : null;
      return { Season, Sales: bucket.Sales, Profit: bucket.Profit, Quantity: bucket.Quantity, Lines: bucket.Lines, Margin: bucket.Sales ? bucket.Profit / bucket.Sales * 100 : 0, CompleteYears: completeYears.length, AverageSales: average("Sales"), AverageProfit: average("Profit") };
    });
  }, [filtered, dateFiltered, filters.startDate, filters.endDate]);
  const discountData = useMemo(() => {
    const cohorts = [{ Cohort: "0%", Sales: 0, Profit: 0, Lines: 0 }, { Cohort: ">0–10%", Sales: 0, Profit: 0, Lines: 0 }, { Cohort: ">10–20%", Sales: 0, Profit: 0, Lines: 0 }, { Cohort: ">20–30%", Sales: 0, Profit: 0, Lines: 0 }, { Cohort: ">30%", Sales: 0, Profit: 0, Lines: 0 }];
    for (const row of filtered) {
      const discount = n(row, "Discount");
      const index = discount === 0 ? 0 : discount <= 0.1 ? 1 : discount <= 0.2 ? 2 : discount <= 0.3 ? 3 : 4;
      cohorts[index].Sales += n(row, "Sales");
      cohorts[index].Profit += n(row, "Profit");
      cohorts[index].Lines++;
    }
    return cohorts.map((cohort) => ({ ...cohort, Margin: cohort.Sales ? cohort.Profit / cohort.Sales * 100 : null }));
  }, [filtered]);
  const productData = useMemo(() => group(filtered, ["Product ID", "Product Name", "Category", "Sub-Category"]).sort((a,b)=>b.Quantity-a.Quantity), [filtered]);
  const trendData = useMemo(() => {
    const dated = filtered.map((row) => ({ ...row, Period: (row["Order Date"] ?? "").slice(0, 7) }));
    return group(dated, ["Period"]).sort((a,b)=>a.Period.localeCompare(b.Period));
  }, [filtered]);

  const totalSales = sum(filtered, "Sales"), totalProfit = sum(filtered, "Profit"), totalUnits = sum(filtered, "Quantity");
  const margin = totalSales ? totalProfit / totalSales * 100 : 0;
  const orders = new Set(filtered.map((row) => row["Order ID"]).filter(Boolean)).size;
  const auditStats = useMemo(() => {
    const dates = transactions.map((row) => row["Order Date"]).filter(Boolean).sort();
    return { dateMin: dates[0] ?? "—", dateMax: dates[dates.length - 1] ?? "—", distinctOrders: new Set(transactions.map((row) => row["Order ID"]).filter(Boolean)).size };
  }, [transactions]);
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => value !== initialFilters[key as keyof Filters]).length;
  const setFilter = (key: keyof Filters, value: string) => setFilters((previous) => ({ ...previous, [key]: value }));
  const clearAllFilters = () => setFilters(initialFilters);
  const currencyNote = "Illustrative INR display only: original source values are unchanged and multiplied by ₹84 per assumed USD; source currency is unverified.";
  const period = `${metadata.date_min} — ${metadata.date_max}`;
  const currencyTag = <span className="currency-assumption" title={currencyNote}>₹84/USD assumption · illustrative</span>;
  const filterPanel = <section className="filter-panel" aria-label="Business filters">
    <div className="filter-panel-heading"><div><strong>Business filters</strong><span>{loading ? "Loading transaction fields…" : `${filtered.length.toLocaleString("en-IN")} of ${transactions.length.toLocaleString("en-IN")} order lines`}</span></div><button className="clear-filters" type="button" disabled={!activeFilterCount} onClick={clearAllFilters}><X size={13}/>Clear All Filters{activeFilterCount > 0 && <i>{activeFilterCount}</i>}</button></div>
    <div className="filter-grid">
      <label>Date Range · Start<input type="date" min={metadata.date_min} max={filters.endDate || metadata.date_max} value={filters.startDate} onChange={(event)=>setFilter("startDate",event.target.value)}/></label>
      <label>Date Range · End<input type="date" min={filters.startDate || metadata.date_min} max={metadata.date_max} value={filters.endDate} onChange={(event)=>setFilter("endDate",event.target.value)}/></label>
      <SelectFilter label="Country" value={filters.country} choices={countries} onChange={(value)=>setFilters((current)=>{ const country = locationKey(value); const stateValid = !current.state || transactions.some((row)=>(!country || locationKey(row["Country/Region"]) === country) && locationKey(row["State/Province"]) === locationKey(current.state)); const state = stateValid ? current.state : ""; const cityValid = !current.city || transactions.some((row)=>(!country || locationKey(row["Country/Region"]) === country) && (!state || locationKey(row["State/Province"]) === locationKey(state)) && locationKey(row.City) === locationKey(current.city)); return {...current,country:value,state,city:cityValid?current.city:""};})}/>
      <SelectFilter label="State" value={filters.state} choices={states} onChange={(value)=>setFilters((current)=>{ const cityValid = !current.city || transactions.some((row)=>(!current.country || locationKey(row["Country/Region"]) === locationKey(current.country)) && (!value || locationKey(row["State/Province"]) === locationKey(value)) && locationKey(row.City) === locationKey(current.city)); return {...current,state:value,city:cityValid?current.city:""};})}/>
      <SelectFilter label="City" value={filters.city} choices={cities} onChange={(value)=>setFilter("city",value)}/>
      <SelectFilter label="Region" value={filters.region} choices={regions} onChange={(value)=>setFilter("region",value)}/>
      <SelectFilter label="Category" value={filters.category} choices={categories} onChange={(value)=>setFilter("category",value)}/>
      <SelectFilter label="Customer Segment" value={filters.segment} choices={segments} onChange={(value)=>setFilter("segment",value)}/>
    </div>
    <div className="filter-footnote">Country and State narrow location options; all locations come from actual transaction rows.</div>
  </section>;

  const metricCards = <div className="metric-grid">{[
    {label:"Net sales",value:money(totalSales),unit:"Illustrative INR display",icon:"↗"},
    {label:"Net profit",value:money(totalProfit),unit:"Illustrative INR · assumed rate",icon:"◒"},
    {label:"Profit margin",value:`${margin.toFixed(2)}%`,unit:"Weighted · profit / sales",icon:"%"},
    {label:"Orders",value:orders.toLocaleString("en-IN"),unit:"Distinct order IDs",icon:"▤"},
    {label:"Units sold",value:totalUnits.toLocaleString("en-IN"),unit:"Filtered quantities",icon:"＋"},
  ].map((item)=><article className="metric-card" key={item.label}><div className="metric-top"><span>{item.label}</span><span className="metric-icon">{item.icon}</span></div><div className="metric-value">{loading?"…":item.value}</div><div className="metric-foot">{item.unit}</div></article>)}</div>;
  const tooltip = <Tooltip formatter={(value:number,key:string)=>key==="Margin"?[`${Number(value).toFixed(2)}%`,"Profit margin"]:key==="Quantity"?[Number(value).toLocaleString("en-IN"),"Units"]:[money(Number(value)),key]} contentStyle={{background:colors.tooltip,borderColor:colors.grid,borderRadius:10,fontSize:11}}/>;
  const yTick = (value:number)=>`₹${(Number(value)*conversionRate/100000).toFixed(0)}L`;

  const overview = <><div className="section-line"><div><h2>Analysis at a glance</h2><p>{filtered.length.toLocaleString("en-IN")} filtered order lines · {orders.toLocaleString("en-IN")} distinct orders</p></div><span className="source-label"><span className="loaded-dot"/> VERIFIED OUTPUTS</span></div>{metricCards}<div className="chart-grid"><Panel title="Profit by category" subtitle="Weighted contribution in the filtered transaction set" unit="Illustrative INR · ₹84/USD assumption"><ChartWrap><BarChart data={categoryData}><CartesianGrid stroke={colors.grid} vertical={false}/><XAxis dataKey="Category" tick={{fill:colors.axis,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tickFormatter={yTick} tick={{fill:colors.axis,fontSize:9}} axisLine={false} tickLine={false}/>{tooltip}<Bar dataKey="Profit" name="Profit" radius={[5,5,0,0]}>{categoryData.map((row,index)=><Cell key={row.Category} fill={palette[index%palette.length]}/>)}</Bar></BarChart></ChartWrap></Panel><Panel title="Monthly sales trend" subtitle="Aggregated from actual Order Date values" unit="Illustrative INR"><ChartWrap><RechartsLineChart data={trendData}><CartesianGrid stroke={colors.grid} vertical={false}/><XAxis dataKey="Period" interval="preserveStartEnd" tick={{fill:colors.axis,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tickFormatter={yTick} tick={{fill:colors.axis,fontSize:9}} axisLine={false} tickLine={false}/>{tooltip}<Line dataKey="Sales" name="Sales" stroke="#A85D45" strokeWidth={2.3} dot={false}/></RechartsLineChart></ChartWrap></Panel></div><div className="lower-grid"><Panel title="Regional performance" subtitle="Regional profit after all active filters" unit="Illustrative INR"><ChartWrap><BarChart data={regionData}><CartesianGrid stroke={colors.grid} vertical={false}/><XAxis dataKey="Region" tick={{fill:colors.axis,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tickFormatter={yTick} tick={{fill:colors.axis,fontSize:8}} axisLine={false} tickLine={false}/>{tooltip}<Bar dataKey="Profit" name="Profit" fill="#7D9676" radius={[4,4,0,0]}/></BarChart></ChartWrap></Panel><article className="panel integrity-panel"><div className="panel-heading"><div><h3>Analysis integrity</h3><p>Evidence first. No inferred stock positions.</p></div><ShieldAlert size={18} className="sage-icon"/></div><div className="integrity-row"><span className="integrity-mark">✓</span><div><strong>Source values preserved</strong><p>₹84/USD is a display-only illustrative assumption.</p></div><span className="state ready">VERIFIED</span></div><div className="integrity-row"><span className="integrity-mark">✓</span><div><strong>Inventory turnover</strong><p>No source inventory/stock fields; not calculated.</p></div><span className="state unavailable">UNAVAILABLE</span></div><div className="integrity-row"><span className="integrity-mark">✓</span><div><strong>Returns worksheet</strong><p>{metadata.sheets.Returns} returned-order records in source.</p></div><span className="state ready">PRESENT</span></div></article></div></>;

  const audit = <><div className="section-line"><div><h2>Dataset quality audit</h2><p>Counts and coverage verified from the source quality record and loaded transactions.</p></div>{currencyTag}</div><div className="audit-cards">{Object.entries(metadata.sheets).map(([name,count])=><article className="metric-card" key={name}><div className="metric-top"><span>{name} sheet rows</span><Database size={16}/></div><div className="metric-value">{Number(count).toLocaleString("en-IN")}</div><div className="metric-foot">Source workbook worksheet</div></article>)}</div><div className="lower-grid"><Panel title="Row and date reconciliation" subtitle="Source processing and cleaned transaction coverage"><div className="audit-list"><div><span>Total source order rows</span><b>{Number(metadata.source_rows).toLocaleString("en-IN")}</b></div><div><span>Cleaned transaction rows</span><b>{transactions.length.toLocaleString("en-IN")}</b></div><div><span>Exact duplicate rows removed</span><b>{Number(metadata.exact_duplicates_removed).toLocaleString("en-IN")}</b></div><div><span>Rows removed for missing required fields</span><b>{Number(metadata.rows_removed_for_missing_required_fields).toLocaleString("en-IN")}</b></div><div><span>Distinct orders</span><b>{auditStats.distinctOrders.toLocaleString("en-IN")}</b></div><div><span>Actual order date coverage</span><b>{auditStats.dateMin} — {auditStats.dateMax}</b></div><div><span>Currency evidence</span><b>{metadata.currency_evidence}</b></div><div><span>Inventory fields detected</span><b>{metadata.inventory_fields.length ? metadata.inventory_fields.join(", ") : "None"}</b></div></div></Panel><Panel title="Missing values by source column" subtitle="Counts from the source quality audit"><div className="audit-list">{Object.entries(metadata.missing_before_cleaning).map(([column,count])=><div key={column}><span>{column}</span><b>{Number(count).toLocaleString("en-IN")}</b></div>)}</div></Panel></div><Panel title="Available transaction fields" subtitle="Fields used for analysis"><div className="field-chips">{Object.entries(metadata.columns).filter(([key])=>!["Year","Month","Month Name","Quarter","Season"].includes(key)).map(([key,type])=><span key={key}>{key}<small>{String(type)}</small></span>)}</div></Panel></>;

  const profitability = <><div className="section-line"><div><h2>Profitability analysis</h2><p>Category, sub-category, region, and discount cohorts update with filters.</p></div>{currencyTag}</div><div className="chart-grid"><Panel title="Category sales & profit" subtitle="Margin = sum(profit) / sum(sales)" unit="Illustrative INR"><ChartWrap><BarChart data={categoryData}><CartesianGrid stroke={colors.grid} vertical={false}/><XAxis dataKey="Category" tick={{fill:colors.axis,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tickFormatter={yTick} tick={{fill:colors.axis,fontSize:8}} axisLine={false} tickLine={false}/>{tooltip}<Bar dataKey="Sales" name="Sales" fill="#708DA3" radius={[4,4,0,0]}/><Bar dataKey="Profit" name="Profit" fill="#A85D45" radius={[4,4,0,0]}/></BarChart></ChartWrap></Panel><Panel title="Regional profit" subtitle="Filtered region comparison" unit="Illustrative INR"><ChartWrap><BarChart data={regionData}><CartesianGrid stroke={colors.grid} vertical={false}/><XAxis dataKey="Region" tick={{fill:colors.axis,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tickFormatter={yTick} tick={{fill:colors.axis,fontSize:8}} axisLine={false} tickLine={false}/>{tooltip}<Bar dataKey="Profit" name="Profit" fill="#7D9676" radius={[4,4,0,0]}/></BarChart></ChartWrap></Panel></div><div className="lower-grid"><Panel title="Sub-category margins" subtitle="Negative profit highlights loss-making groups"><div className="table-wrap"><table><thead><tr><th>Category</th><th>Sub-category</th><th>Sales (illustrative ₹)</th><th>Profit (illustrative ₹)</th><th>Margin</th></tr></thead><tbody>{subcategoryData.map((row)=><tr key={`${row.Category}-${row["Sub-Category"]}`}><td>{row.Category}</td><td>{row["Sub-Category"]}</td><td>{money(row.Sales)}</td><td className={row.Profit<0?"negative":""}>{money(row.Profit)}</td><td>{row.Margin.toFixed(2)}%</td></tr>)}</tbody></table></div></Panel><Panel title="Discount cohort impact" subtitle="Observed association only. Cohorts do not establish that discounting caused profit changes." unit="Illustrative INR · margin %"><ChartWrap><ComposedChart data={discountData}><CartesianGrid stroke={colors.grid} vertical={false}/><XAxis dataKey="Cohort" tick={{fill:colors.axis,fontSize:9}} axisLine={false} tickLine={false}/><YAxis yAxisId="currency" tickFormatter={yTick} tick={{fill:colors.axis,fontSize:8}} axisLine={false} tickLine={false}/><YAxis yAxisId="margin" orientation="right" tickFormatter={(value)=>String(Number(value).toFixed(0))+"%"} tick={{fill:colors.axis,fontSize:8}} axisLine={false} tickLine={false}/><Legend/><Tooltip formatter={(value:number,key:string)=>key==="Margin"||key==="Weighted profit margin"?[value == null ? "—" : `${Number(value).toFixed(2)}%`,"Weighted profit margin"]:[money(Number(value)),key]} contentStyle={{background:colors.tooltip,borderColor:colors.grid,borderRadius:10,fontSize:11}}/><Bar yAxisId="currency" dataKey="Sales" name="Sales" fill="#708DA3" radius={[3,3,0,0]}/><Bar yAxisId="currency" dataKey="Profit" name="Profit" fill="#A85D45" radius={[3,3,0,0]}/><Line yAxisId="margin" dataKey="Margin" name="Weighted profit margin" stroke="#7D9676" strokeWidth={2} dot={{r:3}}/></ComposedChart></ChartWrap><div className="table-wrap"><table><thead><tr><th>Discount cohort</th><th>Sales (illustrative ₹)</th><th>Profit (illustrative ₹)</th><th>Weighted margin</th><th>Order lines</th></tr></thead><tbody>{discountData.map((row)=><tr key={row.Cohort}><td>{row.Cohort}</td><td>{money(row.Sales)}</td><td>{money(row.Profit)}</td><td>{row.Margin === null ? "—" : `${row.Margin.toFixed(2)}%`}</td><td>{row.Lines.toLocaleString("en-IN")}</td></tr>)}</tbody></table></div></Panel></div></>;

  const seasonality = <><div className="section-line"><div><h2>Seasonal & monthly patterns</h2><p>Spring: Mar–May · Summer: Jun–Aug · Autumn: Sep–Nov · Winter: Dec–Feb. Yearly averages include complete seasons only.</p></div>{currencyTag}</div><div className="chart-grid"><Panel title="Monthly sales" subtitle="Monthly totals from actual Order Date values" unit="Illustrative INR"><ChartWrap><RechartsLineChart data={trendData}><CartesianGrid stroke={colors.grid} vertical={false}/><XAxis dataKey="Period" interval="preserveStartEnd" tick={{fill:colors.axis,fontSize:8}} axisLine={false} tickLine={false}/><YAxis tickFormatter={yTick} tick={{fill:colors.axis,fontSize:8}} axisLine={false} tickLine={false}/>{tooltip}<Line dataKey="Sales" name="Sales" stroke="#A85D45" strokeWidth={2.2} dot={false}/></RechartsLineChart></ChartWrap></Panel><Panel title="Cumulative sales by season" subtitle="Totals include any partial seasonal observations" unit="Illustrative INR"><ChartWrap><BarChart data={seasonData}><CartesianGrid stroke={colors.grid} vertical={false}/><XAxis dataKey="Season" tick={{fill:colors.axis,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tickFormatter={yTick} tick={{fill:colors.axis,fontSize:8}} axisLine={false} tickLine={false}/>{tooltip}<Bar dataKey="Sales" name="Cumulative sales" fill="#A85D45" radius={[4,4,0,0]}/></BarChart></ChartWrap></Panel></div><Panel title="Cumulative totals and complete-season yearly averages" subtitle="Average values use only season-years with all three months observed and fully inside the selected date range."><div className="table-wrap"><table><thead><tr><th>Season</th><th>Cumulative sales (illustrative ₹)</th><th>Cumulative profit (illustrative ₹)</th><th>Average sales (illustrative ₹ / complete year)</th><th>Average profit (illustrative ₹ / complete year)</th><th>Complete years</th><th>Cumulative margin</th><th>Units</th></tr></thead><tbody>{seasonData.map((row)=><tr key={row.Season}><td>{row.Season}</td><td>{money(row.Sales)}</td><td>{money(row.Profit)}</td><td>{row.AverageSales === null ? "—" : money(row.AverageSales)}</td><td>{row.AverageProfit === null ? "—" : money(row.AverageProfit)}</td><td>{row.CompleteYears}</td><td>{row.Margin.toFixed(2)}%</td><td>{row.Quantity.toLocaleString("en-IN")}</td></tr>)}</tbody></table></div></Panel></>;

  const velocityMonths = observedMonths;
  const productVelocity = <><div className="section-line"><div><h2>Product sales velocity</h2><p>Units/month over {velocityMonths} observed calendar months · demand proxy only.</p></div>{currencyTag}</div><div className="inventory-warning"><ShieldAlert size={18}/><div><strong>Inventory turnover cannot be calculated from this workbook.</strong><p>No stock-on-hand, warehouse inventory, lead-time, or inventory-days fields were found. Units/month is sales velocity only; low sales do not establish overstock.</p></div></div><div className="lower-grid"><Panel title="Highest unit sales" subtitle="Top products by observed quantity"><ProductTable rows={productData.slice(0,12)} months={velocityMonths} money={money}/></Panel><Panel title="Lowest sales-velocity candidates" subtitle="Review list only—not a claim of overstock"><ProductTable rows={[...productData].sort((a,b)=>a.Quantity-b.Quantity).slice(0,12)} months={velocityMonths} money={money}/></Panel></div><div className="inventory-next">Inventory analysis requires dated stock-on-hand by SKU/location, daily sales, receipts, stockout periods, and supplier lead times.</div></>;

  const deliverables = <><div className="section-line"><div><h2>Final outputs</h2><p>Five concise views of retail performance.</p></div></div><div className="deliverable-grid">{[["01","Business Analytics Dashboard","Interactive overview of sales, profit, and performance."],["02","Profitability Analysis","Clear comparisons of margin and profit."],["03","Sales & Seasonality Insights","Monthly trends and seasonal patterns."],["04","Product Performance Analysis","Product demand and sales velocity."],["05","Executive Report","A concise summary for business decisions."]].map(([num,title,description])=><article className="deliverable-card" key={num}><span>{num}</span><div><strong>{title}</strong><p>{description}</p></div><BarChart3 size={17}/></article>)}</div></>

  const pageContent: Record<string, ReactNode> = {Overview:overview,"Data audit":audit,Profitability:profitability,Seasonality:seasonality,"Product velocity":productVelocity,Deliverables:deliverables};
  const subtitles: Record<string,string> = {Overview:"A rigorous view of sales, margins and product demand.","Data audit":"Source coverage, quality checks and field availability.",Profitability:"Category, region, sub-category and discount performance.",Seasonality:"Sales behavior across observed months and calendar seasons.","Product velocity":"Product demand trends, with inventory limitations made explicit.",Deliverables:"Five clear outputs for retail business decisions."};
  return <main className="workspace">
    <aside className={`sidebar ${menuOpen?"sidebar-open":""}`}><div className="brand"><span className="brand-mark"><BarChart3 size={20}/></span><span>Retail Insight Lab<small>BUSINESS ANALYTICS</small></span></div><div className="side-label">WORKSPACE</div><nav>{sections.map((item,index)=>{const Icon=icons[index];return <button key={item} className={`nav-item ${active===item?"selected":""}`} onClick={()=>{setActive(item);setMenuOpen(false)}}><Icon size={17}/>{item}{item==="Data audit"&&<span className="nav-dot"/>}</button>})}</nav><div className="sidebar-bottom"><div className="source-badge"><span className="pulse loaded-pulse"/>SOURCE STATUS</div><strong>{loading?"Loading analysis data":loadError?"Data load failed":"Analysis outputs loaded"}</strong><p>{loading?"Reading cleaned transaction rows.":loadError||`${transactions.length.toLocaleString("en-IN")} cleaned rows · source values retained.`}</p><div className="side-rule"/><span className="side-foot">SOURCE DATA · 10,194 ORDER LINES</span></div></aside>
    <section className="main-area"><header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" onClick={()=>setMenuOpen(!menuOpen)}><Menu size={20}/></button><div className="breadcrumbs">Projects <span>/</span> <b>Retail performance</b></div><div className="top-actions"><span className="status-chip loaded-status"><i/> {loadError?"Data error":loading?"Loading data":"Verified outputs"}</span><button className="profile">RI</button></div></header>
      <div className="page-content"><div className="eyebrow">RETAIL INSIGHT LAB</div><div className="heading-row"><div><h1>{active==="Overview"?"Retail Insight Lab":active}</h1><p className="subhead">{active==="Overview"?"Retail Business Performance & Profitability Analysis":subtitles[active]}</p></div><div className="period-display"><span className="calendar-icon">◷</span>{filters.startDate} — {filters.endDate}</div></div>
        {active === "Overview" && filterPanel}{loadError?<div className="inventory-warning"><ShieldAlert size={18}/><div><strong>Could not load the generated cleaned CSV.</strong><p>{loadError}</p></div></div>:pageContent[active]}
        <footer className="footer"><span>RETAIL INSIGHT LAB</span><span>INR display: illustrative ₹84 per assumed USD</span></footer></div>
    </section>
  </main>;
}

function ProductTable({ rows, months, money }: { rows: ReturnType<typeof group>; months: number; money: (amount: number) => string }) {
  return <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Units</th><th>Units / month</th><th>Sales (illustrative ₹)</th></tr></thead><tbody>{rows.map((row)=><tr key={row["Product ID"]}><td>{row["Product Name"]}</td><td>{row.Category}</td><td>{row.Quantity.toLocaleString("en-IN")}</td><td>{(row.Quantity/months).toFixed(2)}</td><td>{money(row.Sales)}</td></tr>)}</tbody></table></div>;
}
