--
-- PostgreSQL database dump
--

\restrict l3ESPYWu2qMYLDYlmPsBZrcWP1aByr48nsd59kMhZdCid30PudoE5M0nsU55fI4

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

-- Started on 2026-01-31 11:47:46

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 59006)
-- Name: menusub; Type: TABLE; Schema: inventory_items; Owner: admin_user
--

CREATE TABLE inventory_items.menusub (
    asset_tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    status text DEFAULT 'Available'::text,
    weewr text,
    qwrqwr text
);


ALTER TABLE inventory_items.menusub OWNER TO admin_user;

--
-- TOC entry 230 (class 1259 OID 59016)
-- Name: tablesubs; Type: TABLE; Schema: inventory_items; Owner: admin_user
--

CREATE TABLE inventory_items.tablesubs (
    asset_tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    status text DEFAULT 'Available'::text,
    qwr text,
    ewtdsg text
);


ALTER TABLE inventory_items.tablesubs OWNER TO admin_user;

--
-- TOC entry 232 (class 1259 OID 59200)
-- Name: test; Type: TABLE; Schema: inventory_items; Owner: admin_user
--

CREATE TABLE inventory_items.test (
    asset_tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    status text DEFAULT 'Available'::text,
    test text,
    testimngg text,
    "user" text
);


ALTER TABLE inventory_items.test OWNER TO admin_user;

--
-- TOC entry 231 (class 1259 OID 59128)
-- Name: testings; Type: TABLE; Schema: inventory_items; Owner: admin_user
--

CREATE TABLE inventory_items.testings (
    asset_tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    status text DEFAULT 'Available'::text,
    ewt text,
    qwr text
);


ALTER TABLE inventory_items.testings OWNER TO admin_user;

--
-- TOC entry 4683 (class 2606 OID 59015)
-- Name: menusub submenu_pkey; Type: CONSTRAINT; Schema: inventory_items; Owner: admin_user
--

ALTER TABLE ONLY inventory_items.menusub
    ADD CONSTRAINT submenu_pkey PRIMARY KEY (asset_tag);


--
-- TOC entry 4685 (class 2606 OID 59025)
-- Name: tablesubs subtable_pkey; Type: CONSTRAINT; Schema: inventory_items; Owner: admin_user
--

ALTER TABLE ONLY inventory_items.tablesubs
    ADD CONSTRAINT subtable_pkey PRIMARY KEY (asset_tag);


--
-- TOC entry 4689 (class 2606 OID 59209)
-- Name: test test_pkey; Type: CONSTRAINT; Schema: inventory_items; Owner: admin_user
--

ALTER TABLE ONLY inventory_items.test
    ADD CONSTRAINT test_pkey PRIMARY KEY (asset_tag);


--
-- TOC entry 4687 (class 2606 OID 59137)
-- Name: testings testew_pkey; Type: CONSTRAINT; Schema: inventory_items; Owner: admin_user
--

ALTER TABLE ONLY inventory_items.testings
    ADD CONSTRAINT testew_pkey PRIMARY KEY (asset_tag);


-- Completed on 2026-01-31 11:47:46

--
-- PostgreSQL database dump complete
--

\unrestrict l3ESPYWu2qMYLDYlmPsBZrcWP1aByr48nsd59kMhZdCid30PudoE5M0nsU55fI4

